'use client'

import { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import type { Message, UserProfile } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCollection, useFirestore, useUser, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, orderBy, addDoc, serverTimestamp, doc, getDoc, getDocs } from 'firebase/firestore';
import { getProfileById } from '@/lib/data';

export default function ChatPage({ params }: { params: { id: string } }) {
    const { user } = useUser();
    const firestore = useFirestore();
    const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // The ID in the URL is now the Match ID, not the other user's ID
    const matchId = params.id;

    const matchRef = useMemoFirebase(() => {
        if (!matchId) return null;
        return doc(firestore, 'matches', matchId);
    }, [firestore, matchId]);

    const { data: match, isLoading: isMatchLoading } = useDoc(matchRef);

    useEffect(() => {
        const fetchOtherUser = async () => {
            if (isMatchLoading || !match || !user) return;
            
            const otherUserId = match.userIds.find((id: string) => id !== user.uid);

            if (otherUserId) {
                const profile = await getProfileById(firestore, otherUserId);
                if (profile) {
                    setOtherUser(profile);
                } else {
                    notFound();
                }
            }
            setIsLoading(false);
        };
        fetchOtherUser();
    }, [match, isMatchLoading, user, firestore]);
    
    const messagesQuery = useMemoFirebase(() => {
        if (!matchId) return null;
        return query(collection(firestore, `matches/${matchId}/chatMessages`), orderBy('timestamp', 'asc'));
    }, [firestore, matchId]);
    
    const { data: messages } = useCollection<Message>(messagesQuery);

    const otherUserAvatar = otherUser?.profilePictureUrls ? otherUser.profilePictureUrls[0] : null;

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() === '' || !user || !matchId) return;

        const messageData = {
            matchId,
            senderId: user.uid,
            recipientId: otherUser?.id, // Good to have
            text: newMessage,
            timestamp: serverTimestamp(),
        };

        await addDoc(collection(firestore, `matches/${matchId}/chatMessages`), messageData);
        setNewMessage('');
    };
    
    if (isLoading || isMatchLoading || !otherUser) {
        return <div>Chargement de la conversation...</div>
    }

    return (
        <div className="h-full flex flex-col max-w-3xl mx-auto">
            <Card className="flex flex-col flex-1">
                <div className="flex items-center p-3 border-b">
                    <Button variant="ghost" size="icon" className="md:hidden mr-2" asChild>
                        <Link href="/messages"><ArrowLeft className="h-4 w-4" /></Link>
                    </Button>
                    <Link href={`/profils/${otherUser.id}`} className="flex items-center gap-3">
                        <Avatar>
                            {otherUserAvatar && <AvatarImage src={otherUserAvatar} />}
                            <AvatarFallback>{otherUser.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="font-semibold">{otherUser.name}</span>
                    </Link>
                </div>

                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                        {messages?.map(msg => (
                            <div
                                key={msg.id}
                                className={cn(
                                    "flex items-end gap-2 max-w-xs md:max-w-md",
                                    msg.senderId === user?.uid ? "ml-auto flex-row-reverse" : "mr-auto"
                                )}
                            >
                                <Avatar className="h-8 w-8">
                                    {msg.senderId !== user?.uid && otherUserAvatar && <AvatarImage src={otherUserAvatar} />}
                                    <AvatarFallback>{msg.senderId === user?.uid ? user.email?.charAt(0).toUpperCase() : otherUser.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div
                                    className={cn(
                                        "p-3 rounded-xl",
                                        msg.senderId === user?.uid
                                            ? "bg-primary text-primary-foreground rounded-br-none"
                                            : "bg-muted rounded-bl-none"
                                    )}
                                >
                                    <p className="text-sm">{msg.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
                
                <div className="p-4 border-t bg-background">
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                        <Input 
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Écrivez votre message..." 
                            autoComplete="off"
                        />
                        <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </div>
            </Card>
        </div>
    );
}
