'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Check, Mail, X } from 'lucide-react';
import { useUser, useCollection, useFirestore, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import type { Match, UserProfile } from '@/lib/types';
import { useEffect, useState } from 'react';
import { getProfileById } from '@/lib/data';

export default function MatchsPage() {
    const { user } = useUser();
    const firestore = useFirestore();

    const [receivedRequests, setReceivedRequests] = useState<UserProfile[]>([]);
    const [confirmedMatches, setConfirmedMatches] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const matchesQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(collection(firestore, 'matches'), where('userIds', 'array-contains', user.uid));
    }, [firestore, user]);

    const { data: userMatches, isLoading: areMatchesLoading } = useCollection<Match>(matchesQuery);

    useEffect(() => {
        const processMatches = async () => {
            if (areMatchesLoading || !user || !firestore) {
                // We are loading or don't have the necessary info yet
                if(!areMatchesLoading) setIsLoading(false);
                return;
            }

            if (!userMatches) {
                 setIsLoading(false);
                 return;
            }
            
            setIsLoading(true);
            const requests: UserProfile[] = [];
            const confirmed: UserProfile[] = [];

            const profilesPromises = userMatches.map(async (match) => {
                // Find the other user's ID in the match
                const otherUserId = match.userIds.find(id => id !== user.uid);
                if (otherUserId) {
                    const profile = await getProfileById(firestore, otherUserId);
                    if (profile) {
                         const profileWithMatch = { ...profile, matchId: match.id };
                        // This is a pending request FOR ME if my ID is the second one in the array (the recipient)
                        if (match.status === 'pending' && match.userIds[1] === user.uid) { 
                            requests.push(profileWithMatch);
                        } else if (match.status === 'matched') {
                            confirmed.push(profileWithMatch);
                        }
                    }
                }
            });

            await Promise.all(profilesPromises);

            setReceivedRequests(requests);
            setConfirmedMatches(confirmed);
            setIsLoading(false);
        };

        processMatches();

    }, [userMatches, areMatchesLoading, user, firestore]);

    const handleAccept = (matchId: string) => {
        if (!firestore || !matchId) return;
        const matchRef = doc(firestore, 'matches', matchId);
        updateDocumentNonBlocking(matchRef, { status: 'matched' });
        // Optimistically update UI
        const acceptedRequestProfile = receivedRequests.find(p => (p as any).matchId === matchId);
        if(acceptedRequestProfile) {
            setReceivedRequests(prev => prev.filter(p => (p as any).matchId !== matchId));
            setConfirmedMatches(prev => [...prev, acceptedRequestProfile]);
        }
    };

    const handleReject = (matchId: string) => {
        if (!firestore || !matchId) return;
        // In a real app, you might want to delete the match doc or set a 'rejected' status
        const matchRef = doc(firestore, 'matches', matchId);
        updateDocumentNonBlocking(matchRef, { status: 'rejected' });
        // Optimistically update UI
        setReceivedRequests(prev => prev.filter(p => (p as any).matchId !== matchId));
    };


    if (isLoading) {
        return <div>Chargement...</div>
    }

    return (
        <div className="container mx-auto max-w-4xl space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Matchs</h1>
                <p className="text-muted-foreground">Gérez vos demandes de match et vos conversations.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Demandes reçues ({receivedRequests.length})</CardTitle>
                    <CardDescription>Ces personnes souhaitent matcher avec vous.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {receivedRequests.length > 0 ? (
                        receivedRequests.map(profile => {
                            const avatar = profile.profilePictureUrls ? profile.profilePictureUrls[0] : null;
                            const matchId = (profile as any).matchId;
                            return (
                                <div key={profile.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                                    <Link href={`/profils/${profile.id}`} className="flex items-center gap-4">
                                        <Avatar className="h-12 w-12">
                                            {avatar && <AvatarImage src={avatar} />}
                                            <AvatarFallback>{profile.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold">{profile.name}, {profile.age}</p>
                                            <p className="text-sm text-muted-foreground">{profile.city}</p>
                                        </div>
                                    </Link>
                                    <div className="flex gap-2">
                                        <Button size="icon" variant="outline" className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white" onClick={() => handleReject(matchId)}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                        <Button size="icon" className="bg-match text-match-foreground hover:bg-match/90" onClick={() => handleAccept(matchId)}>
                                            <Check className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-muted-foreground text-center py-4">Aucune nouvelle demande.</p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Mes matchs ({confirmedMatches.length})</CardTitle>
                    <CardDescription>Vous avez matché ! Engagez la conversation.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {confirmedMatches.length > 0 ? (
                        confirmedMatches.map(profile => {
                            const avatar = profile.profilePictureUrls ? profile.profilePictureUrls[0] : null;
                            return (
                                <div key={profile.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                                     <Link href={`/profils/${profile.id}`} className="flex items-center gap-4">
                                        <Avatar className="h-12 w-12">
                                            {avatar && <AvatarImage src={avatar} />}
                                            <AvatarFallback>{profile.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold">{profile.name}, {profile.age}</p>
                                            <p className="text-sm text-muted-foreground">{profile.city}</p>
                                        </div>
                                    </Link>
                                    <Button asChild>
                                        <Link href={`/messages/${(profile as any).matchId}`}>
                                            <Mail className="h-4 w-4 mr-2" /> Message
                                        </Link>
                                    </Button>
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-muted-foreground text-center py-4">Vous n'avez encore aucun match.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
