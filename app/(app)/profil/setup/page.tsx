import { ProfileForm } from "@/components/togo-rencontre/profile-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProfileSetupPage() {
    return (
        <div className="max-w-4xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Configuration du Profil</CardTitle>
                    <CardDescription>
                        Complétez votre profil pour commencer à rencontrer des gens. C'est la dernière étape !
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ProfileForm />
                </CardContent>
            </Card>
        </div>
    );
}
