'use client';
import { notFound, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, MapPin, ShieldAlert, Check, Briefcase, Users, Sparkles } from 'lucide-react';
import { ReportDialog } from '@/components/togo-rencontre/report-dialog';
import { useDoc, useFirestore, useUser, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { doc, collection, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import type { UserProfile, Match, ProfileType } from '@/lib/types';
import { useEffect, useState } from 'react';
import { getProfileById } from '@/lib/data';
import { cn } from '@/lib/utils';


export default function ProfilePage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const { user } = useUser();
    const firestore = useFirestore();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [matchStatus, setMatchStatus] = useState<'loading' | 'matched' | 'pending-them' | 'pending-you' | 'none'>('loading');
    const [matchId, setMatchId] = useState<string | null>(null);
    const [commonPassions, setCommonPassions] = useState<string[]>([]);
    
    const profileId = params.id;

    // Fetch the profile being viewed
    useEffect(() => {
      const fetchProfile = async () => {
        setIsLoading(true);
        const profileData = await getProfileById(firestore, profileId);
        if (profileData) {
          setProfile(profileData);
        } else {
          notFound();
        }
        setIsLoading(false);
      }
      fetchProfile();
    }, [firestore, profileId]);

    // Fetch the current user's profile to compare passions
    const currentUserProfileRef = useMemoFirebase(() => {
        if (!user) return null;
        return doc(firestore, "users", user.uid);
    }, [firestore, user]);
    const { data: currentUserProfile } = useDoc<UserProfile>(currentUserProfileRef);

    // Calculate common passions
    useEffect(() => {
        if (profile && currentUserProfile) {
            const viewedUserPassions = profile.passions || [];
            const currentUserPassions = currentUserProfile.passions || [];
            const common = viewedUserPassions.filter(p => currentUserPassions.includes(p));
            setCommonPassions(common);
        }
    }, [profile, currentUserProfile]);


     useEffect(() => {
        const checkMatchStatus = async () => {
            if (!user || !profile || !firestore) return;
            
            setMatchStatus('loading');
            const matchesRef = collection(firestore, 'matches');
            // Query for matches involving the current user and the viewed profile
            const q = query(
                matchesRef, 
                where('userIds', 'in', [[user.uid, profile.id], [profile.id, user.uid]])
            );
            
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const relevantMatchDoc = querySnapshot.docs[0];
                const relevantMatch = { ...relevantMatchDoc.data(), id: relevantMatchDoc.id } as Match
                setMatchId(relevantMatch.id);
                if (relevantMatch.status === 'matched') {
                    setMatchStatus('matched');
                } else if (relevantMatch.userIds[0] === user.uid) { // If I was the one who initiated
                    setMatchStatus('pending-them');
                } else { // If they initiated
                    setMatchStatus('pending-you');
                }
            } else {
                setMatchStatus('none');
            }
        };
        checkMatchStatus();
    }, [user, profile, firestore]);

    if (isLoading || !profile) {
        return <div>Chargement du profil...</div>;
    }

    const handleMatch = async () => {
        if (!user || !profile || matchStatus !== 'none') return;
        
        setMatchStatus('loading');
        
        const newMatch: Omit<Match, 'id' | 'createdAt'> & { createdAt: any } = {
            userIds: [user.uid, profile.id],
            status: 'pending',
            createdAt: serverTimestamp(),
        };

        const matchesCollection = collection(firestore, 'matches');
        addDocumentNonBlocking(matchesCollection, newMatch);
        setMatchStatus('pending-them');
    };

    const handleAcceptMatch = () => {
        if (!matchId || !firestore) return;
        setMatchStatus('loading');
        const matchRef = doc(firestore, 'matches', matchId);
        updateDocumentNonBlocking(matchRef, { status: 'matched' });
        setMatchStatus('matched');
    };
    
    const photos = profile.profilePictureUrls || [];

    const getMatchButton = () => {
        // Don't show match button for your own profile
        if (user && user.uid === profile.id) return null;

        switch (matchStatus) {
            case 'loading':
                 return <Button size="lg" disabled className="w-full">Chargement...</Button>
            case 'matched':
                return <Button size="lg" disabled className="w-full bg-green-500"><Check className="mr-2 h-5 w-5" />Vous avez matché !</Button>;
            case 'pending-them':
                return <Button size="lg" disabled variant="secondary" className="w-full">Demande envoyée</Button>;
            case 'pending-you':
                return <Button size="lg" onClick={handleAcceptMatch} className="w-full bg-match text-match-foreground hover:bg-match/90">Accepter le Match</Button>;
            default:
                return (
                    <Button size="lg" onClick={handleMatch} className="w-full bg-match text-match-foreground hover:bg-match/90">
                        <Heart className="mr-2 h-5 w-5" /> Matcher
                    </Button>
                );
        }
    };

    const profileTypeIcons: Record<ProfileType, React.ReactElement> = {
        'Amoureuse': <Heart className="h-4 w-4" />,
        'Amicale': <Users className="h-4 w-4" />,
        'Professionnelle': <Briefcase className="h-4 w-4" />,
    }
    
    const mainPhoto = photos[0];

    return (
        <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                    <Card className="overflow-hidden">
                       {photos.length > 0 ? (
                        <Carousel className="w-full">
                            <CarouselContent>
                                {photos.map((photoUrl, index) => (
                                    <CarouselItem key={index}>
                                        <div className="aspect-video relative">
                                            <Image
                                                src={photoUrl}
                                                alt={`Photo de ${profile.name} ${index + 1}`}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            <CarouselPrevious className="left-4" />
                            <CarouselNext className="right-4" />
                        </Carousel>
                        ) : (
                            <div className="aspect-video bg-secondary flex items-center justify-center">
                                <p className="text-muted-foreground">Aucune photo</p>
                            </div>
                        )}
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-3xl">{profile.name}, {profile.age}</CardTitle>
                                    <div className="flex items-center text-muted-foreground mt-1">
                                        <MapPin className="h-4 w-4 mr-1" />
                                        <span>{profile.city}</span>
                                    </div>
                                </div>
                                {mainPhoto && user && user.uid !== profile.id && (
                                    <ReportDialog 
                                        profileId={profile.id}
                                        reportedContent={mainPhoto}
                                        contentType="photo"
                                    />
                                )}
                            </div>
                             {profile.profileTypes && profile.profileTypes.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-4">
                                    {profile.profileTypes.map(type => (
                                        <Badge key={type} variant="secondary" className={cn(
                                            "py-1 px-3 capitalize border-transparent",
                                            type === 'Amoureuse' && 'bg-red-900/50 text-red-300',
                                            type === 'Amicale' && 'bg-blue-900/50 text-blue-300',
                                            type === 'Professionnelle' && 'bg-purple-900/50 text-purple-300'
                                        )}>
                                            <div className="flex items-center gap-1.5">
                                                {profileTypeIcons[type]}
                                                {type}
                                            </div>
                                        </Badge>
                                    ))}
                                </div>
                             )}
                        </CardHeader>
                        <CardContent>
                            {getMatchButton()}
                        </CardContent>
                    </Card>

                    {commonPassions.length > 0 && (
                        <Card className="bg-primary/10 border-primary/20">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-primary" />
                                    Vous avez ça en commun !
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-wrap gap-2">
                                {commonPassions.map(passion => (
                                    <Badge key={passion} variant="default" className="text-base py-1 px-3 bg-primary/80">
                                        {passion}
                                    </Badge>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {profile.bio && (
                        <Card>
                            <CardHeader><CardTitle className="text-lg">À propos de moi</CardTitle></CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">{profile.bio}</p>
                            </CardContent>
                        </Card>
                    )}

                    {profile.passions && profile.passions.length > 0 && (
                        <Card>
                            <CardHeader><CardTitle className="text-lg">Passions</CardTitle></CardHeader>
                            <CardContent className="flex flex-wrap gap-2">
                                {profile.passions.map(passion => (
                                    <Badge 
                                        key={passion} 
                                        variant={commonPassions.includes(passion) ? "default" : "secondary"} 
                                        className={cn(
                                            "py-1 px-2 text-sm", 
                                            commonPassions.includes(passion) && "bg-primary/80"
                                        )}>
                                        {passion}
                                    </Badge>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
