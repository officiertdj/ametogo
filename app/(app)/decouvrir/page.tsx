
'use client'

import React, { useState, useMemo, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Undo2, Heart } from 'lucide-react';
import type { UserProfile, ProfileType } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { SwipeCard } from '@/components/togo-rencontre/swipe-card';
import { Button } from '@/components/ui/button';
import { useUser, useFirestore, useCollection, useDoc, updateDocumentNonBlocking, addDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs, serverTimestamp, doc, limit } from 'firebase/firestore';

export default function DecouvrirPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  // Filters
  const [cityFilter, setCityFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');
  const [profileTypeFilter, setProfileTypeFilter] = useState<ProfileType | 'all'>('all');

  // Swipe state
  const [lastAction, setLastAction] = useState<'pass' | 'like' | null>(null);
  const [lastSwipedProfileId, setLastSwipedProfileId] = useState<string | null>(null);

  // Fetch current user's profile to get their swipes
  const currentUserProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);
  const { data: currentUserProfile, isLoading: isCurrentUserProfileLoading } = useDoc<UserProfile>(currentUserProfileRef);

  // Memoize the swiped IDs from the current user's profile
  const swipedUserIds = useMemo(() => {
    if (!currentUserProfile || !currentUserProfile.swipes) return [];
    return Object.keys(currentUserProfile.swipes);
  }, [currentUserProfile]);

  // Query to get a batch of potential profiles from Firestore
  const profilesQuery = useMemoFirebase(() => {
    if (!user) return null;
    // Get up to 30 profiles. In a real app, you'd add more complex logic
    // for pagination and randomization.
    return query(collection(firestore, 'users'), limit(30));
  }, [firestore, user]);

  const { data: allProfiles, isLoading: areProfilesLoading } = useCollection<UserProfile>(profilesQuery);

  // Get all unique cities for the filter dropdown
  const uniqueCities = useMemo(() => {
      if (!allProfiles) return [];
      const cities = new Set(allProfiles.map(p => p.city));
      return ['all', ...Array.from(cities)];
  }, [allProfiles]);


  // Filter out profiles that have already been swiped and apply filters
  const filteredProfiles = useMemo(() => {
    if (!allProfiles) return [];
    let profiles = allProfiles;
    
    // Filter out current user and swiped users
    profiles = profiles.filter(p => user ? p.id !== user.uid : true);
    profiles = profiles.filter(p => !swipedUserIds.includes(p.id));

    if (cityFilter !== 'all') {
      profiles = profiles.filter(p => p.city === cityFilter);
    }
    if (genderFilter !== 'all') {
      profiles = profiles.filter(p => p.gender === genderFilter);
    }
    if (profileTypeFilter !== 'all') {
      profiles = profiles.filter(p => p.profileTypes && p.profileTypes.includes(profileTypeFilter));
    }

    return profiles.reverse(); // Reverse to treat the array like a stack
  }, [allProfiles, swipedUserIds, user, cityFilter, genderFilter, profileTypeFilter]);


  const isLoading = isCurrentUserProfileLoading || areProfilesLoading;
  const currentProfile = filteredProfiles.length > 0 ? filteredProfiles[filteredProfiles.length - 1] : null;

  const handleSwipe = async (direction: 'left' | 'right', profile: UserProfile) => {
    if (!profile || !user || !currentUserProfileRef) return;
    
    setLastSwipedProfileId(profile.id);

    // Optimistically update swipes on the user's profile
    const newSwipe = { [`swipes.${profile.id}`]: direction === 'right' ? 'like' : 'pass' };
    updateDocumentNonBlocking(currentUserProfileRef, newSwipe);

    if (direction === 'right') {
      console.log(`Liked ${profile.name}`);
      setLastAction('like');
      
      // Check if the other person has already liked me
      const otherUserDocRef = doc(firestore, 'users', profile.id);
      const otherUserDoc = await getDocs(query(collection(firestore, 'users'), where('id', '==', profile.id)));
      
      if (!otherUserDoc.empty) {
        const otherUserProfile = otherUserDoc.docs[0].data() as UserProfile;
        if (otherUserProfile.swipes && otherUserProfile.swipes[user.uid] === 'like') {
            // It's a match! Create a new match document.
             const newMatch = {
                userIds: [user.uid, profile.id],
                status: 'matched',
                createdAt: serverTimestamp(),
              };
             addDocumentNonBlocking(collection(firestore, 'matches'), newMatch);
             // TODO: Show a match notification!
             console.log(`🎉 C'est un match avec ${profile.name}!`);
        }
      }

    } else {
      console.log(`Passed ${profile.name}`);
      setLastAction('pass');
    }
  };

  const handleUndo = () => {
    if (lastSwipedProfileId && user && currentUserProfileRef) {
      // To undo, we need to remove the swipe from the user's profile in Firestore.
      // This is more complex and might need a dedicated Cloud Function in a real app
      // to handle atomicity. For now, we just reset the local state.
      console.log("Undo is a premium feature! For now, we'll just reset state locally.");
      
      // A simple local undo for demonstration:
      setLastSwipedProfileId(null);
      setLastAction(null);
      // NOTE: This doesn't actually remove the swipe from Firestore, so the profile
      // will not reappear on refresh. A full implementation would require a dedicated
      // backend operation.
    }
  }

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="relative w-full h-[500px] md:h-[600px]">
           <Skeleton className="w-full h-full rounded-2xl" />
        </div>
      );
    }

    if (!currentProfile) {
      return (
        <div className="w-full h-[500px] md:h-[600px] bg-card border rounded-2xl flex flex-col items-center justify-center text-center">
            <h3 className="text-2xl font-bold">C'est tout pour aujourd'hui !</h3>
            <p className="text-muted-foreground mt-2">Vous avez vu tous les profils disponibles.</p>
            <p className="text-muted-foreground">Revenez plus tard ou ajustez vos critères.</p>
        </div>
      );
    }
    
    const visibleCards = filteredProfiles.slice(-3);

    return (
      <div className="relative w-full h-[500px] md:h-[600px] flex items-center justify-center">
         {visibleCards.map((profile, index) => (
             <SwipeCard
                key={profile.id}
                profile={profile}
                onSwipe={(dir) => handleSwipe(dir, profile)}
                isActive={index === visibleCards.length - 1}
             />
         ))}
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl">
      <div className="space-y-2 mb-4 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Découvrir</h1>
        <p className="text-muted-foreground">Trouvez des profils qui vous correspondent.</p>
      </div>

       <div className="mb-4 bg-card p-4 rounded-lg border shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filtrer par ville" />
            </SelectTrigger>
            <SelectContent>
              {uniqueCities.map(city => (
                <SelectItem key={city} value={city}>
                  {city === 'all' ? 'Toutes les villes' : city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={genderFilter} onValueChange={setGenderFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filtrer par genre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les genres</SelectItem>
              <SelectItem value="Homme">Hommes</SelectItem>
              <SelectItem value="Femme">Femmes</SelectItem>
            </SelectContent>
          </Select>
          <Select value={profileTypeFilter} onValueChange={setProfileTypeFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Type de rencontre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les rencontres</SelectItem>
              <SelectItem value="Amoureuse">Amoureuse</SelectItem>
              <SelectItem value="Amicale">Amicale</SelectItem>
              <SelectItem value="Professionnelle">Professionnelle</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {renderContent()}

      <div className="flex justify-center items-center gap-4 mt-6">
        <Button 
            onClick={() => currentProfile && handleSwipe('left', currentProfile)} 
            disabled={!currentProfile}
            variant="outline" 
            className="rounded-full h-16 w-16 p-0 border-2 border-yellow-500 text-yellow-500 hover:bg-yellow-500/10"
        >
            <X className="h-8 w-8" />
        </Button>
        <Button 
            onClick={handleUndo} 
            disabled={!lastSwipedProfileId}
            variant="outline" 
            className="rounded-full h-12 w-12 p-0 border-2"
        >
            <Undo2 className="h-6 w-6" />
        </Button>
        <Button 
            onClick={() => currentProfile && handleSwipe('right', currentProfile)}
            disabled={!currentProfile}
            variant="outline" 
            className="rounded-full h-16 w-16 p-0 border-2 bg-match/10 border-match text-match hover:bg-match/20"
        >
            <Heart className="h-8 w-8" />
        </Button>
      </div>

    </div>
  );
}
