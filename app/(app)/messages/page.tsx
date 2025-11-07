'use client';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs, doc, getDoc, orderBy, limit } from 'firebase/firestore';
import type { Match, UserProfile, Message, Conversation } from '@/lib/types';
import { useEffect, useState } from 'react';
import { getProfileById } from '@/lib/data';

function ConversationItem({ convo }: { convo: Conversation }) {
    const user = convo.otherUser;
    if (!user) return null;
    const avatar = user.profilePictureUrls ? user.profilePictureUrls[0] : null;

    return (
        <Link href={`/messages/${convo.id}`} className="block hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-4 p-4">
                <Avatar className="h-14 w-14">
                    {avatar && <AvatarImage src={avatar} />}
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <p className="font-semibold">{user.name}</p>
                        {convo.lastMessage?.timestamp && (
                           <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date( (convo.lastMessage.timestamp as any).toDate() ), { addSuffix: true, locale: fr })}
                           </p>
                        )}
                    </div>
                    <div className="flex justify-between items-end mt-1">
                        <p className="text-sm text-muted-foreground truncate max-w-xs">{convo.lastMessage?.text}</p>
                        {convo.unreadCount > 0 && (
                            <Badge className="bg-primary hover:bg-primary">{convo.unreadCount}</Badge>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    )
}

export default function MessagesPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const matchesQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(collection(firestore, 'matches'), where('status', '==', 'matched'), where('userIds', 'array-contains', user.uid));
    }, [firestore, user]);

    const { data: matches, isLoading: areMatchesLoading } = useCollection<Match>(matchesQuery);

    useEffect(() => {
        const fetchConversations = async () => {
             if (areMatchesLoading || !user || !firestore) {
                 if(!areMatchesLoading) setIsLoading(false);
                return;
            }

            if (!matches) {
                 setIsLoading(false);
                 return;
            }

            setIsLoading(true);
            const convos: Conversation[] = [];

            const convoPromises = matches.map(async (match) => {
                const otherUserId = match.userIds.find(id => id !== user.uid);
                if (otherUserId) {
                    const otherUser = await getProfileById(firestore, otherUserId);
                    if (otherUser) {
                         const messagesQuery = query(collection(firestore, `matches/${match.id}/chatMessages`), orderBy('timestamp', 'desc'), limit(1));
                         const messagesSnapshot = await getDocs(messagesQuery);
                         const lastMessage = messagesSnapshot.docs.length > 0 ? { ...messagesSnapshot.docs[0].data(), id: messagesSnapshot.docs[0].id } as Message : null;

                        convos.push({
                            id: match.id,
                            otherUser,
                            lastMessage,
                            unreadCount: 0, // Mocked for now
                        });
                    }
                }
            });

            await Promise.all(convoPromises);
            
            setConversations(convos);
            setIsLoading(false);
        };
        fetchConversations();

    }, [matches, areMatchesLoading, user, firestore]);
    

    return (
        <div className="container mx-auto max-w-2xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
                <p className="text-muted-foreground">Vos conversations privées avec vos matchs.</p>
            </div>

            <Card>
                <CardContent className="p-0">
                    <div className="divide-y">
                        {isLoading ? (
                             <p className="text-muted-foreground text-center p-8">Chargement des conversations...</p>
                        ) : conversations.length > 0 ? (
                            conversations
                                .sort((a, b) => {
                                    const timeA = a.lastMessage?.timestamp ? (a.lastMessage.timestamp as any).toDate().getTime() : 0;
                                    const timeB = b.lastMessage?.timestamp ? (b.lastMessage.timestamp as any).toDate().getTime() : 0;
                                    return timeB - timeA;
                                })
                                .map(convo => <ConversationItem key={convo.id} convo={convo} />)
                        ) : (
                            <p className="text-muted-foreground text-center p-8">Aucune conversation pour le moment.</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
