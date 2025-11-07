'use client';
import { ProfileForm } from "@/components/togo-rencontre/profile-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDoc, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import type { UserProfile } from "@/lib/types";
import { doc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";


export default function MyProfilePage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const userProfileRef = useMemoFirebase(() => {
        if (!user) return null;
        return doc(firestore, "users", user.uid);
    }, [firestore, user]);

    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

    if (isUserLoading || isProfileLoading) {
        return (
             <div className="max-w-4xl mx-auto">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-72" />
                    </CardHeader>
                    <CardContent className="space-y-8">
                         <Skeleton className="h-10 w-full" />
                         <Skeleton className="h-20 w-full" />
                         <Skeleton className="h-40 w-full" />
                         <Skeleton className="h-10 w-32" />
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Mon Profil</CardTitle>
                    <CardDescription>Modifiez vos informations et gérez vos photos.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ProfileForm user={userProfile} />
                </CardContent>
            </Card>
        </div>
    );
}
