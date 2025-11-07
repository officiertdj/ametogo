'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { useAuth, useFirestore, useUser } from '@/firebase';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, UserCredential } from 'firebase/auth';
import { useState } from 'react';
import { FirebaseError } from 'firebase/app';
import { Eye, EyeOff } from 'lucide-react';
import { checkIfProfileExists } from '@/lib/data';

const emailFormSchema = z.object({
  email: z.string().email({ message: 'Adresse email invalide.' }),
  password: z.string().min(1, { message: 'Mot de passe requis.' }),
});

const GoogleIcon = () => (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"/>
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.223 0-9.65-3.657-11.303-8H6.306C9.656 39.663 16.318 44 24 44z"/>
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.012 35.426 44 30.039 44 24c0-1.341-.138-2.65-.389-3.917z"/>
    </svg>
  );

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const emailForm = useForm<z.infer<typeof emailFormSchema>>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: { email: '', password: '' },
  });

  const handleSuccessfulLogin = async (userCredential: UserCredential) => {
    const profileExists = await checkIfProfileExists(firestore, userCredential.user.uid);
    if (profileExists) {
      router.replace('/decouvrir');
    } else {
      router.replace('/profil/setup');
    }
  };

  async function onEmailSubmit({ email, password }: z.infer<typeof emailFormSchema>) {
    setIsSubmitting(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await handleSuccessfulLogin(userCredential);
    } catch (error: any) {
      console.error(error);
      let description = "Une erreur s'est produite. Veuillez réessayer.";
      if (error instanceof FirebaseError) {
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
          description = "L'adresse e-mail ou le mot de passe est incorrect.";
        }
      }
       toast({
        variant: "destructive",
        title: "Échec de la connexion",
        description: description,
      });
    } finally {
        setIsSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    setIsGoogleSubmitting(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      await handleSuccessfulLogin(userCredential);
    } catch (error: any) {
      console.error("Google Sign-in error", error);
      let description = "Une erreur s'est produite lors de la connexion avec Google. Veuillez réessayer.";
      if (error instanceof FirebaseError) {
        if (error.code === 'auth/account-exists-with-different-credential') {
          description = "Un compte existe déjà avec cet e-mail. Veuillez vous connecter avec votre méthode d'origine.";
        }
        if (error.code === 'auth/operation-not-allowed') {
          description = "La connexion avec Google n'est pas activée pour cette application. Contactez le support.";
        }
      }
      toast({
        variant: "destructive",
        title: "Échec de la connexion Google",
        description,
      });
    } finally {
      setIsGoogleSubmitting(false);
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Se connecter</CardTitle>
        <CardDescription>Accédez à votre compte pour rencontrer de nouvelles personnes.</CardDescription>
      </CardHeader>
      <CardContent>
         <div className="space-y-4">
             <Button 
                variant="outline" 
                className="w-full" 
                onClick={handleGoogleSignIn}
                disabled={isGoogleSubmitting || isSubmitting}
            >
                {isGoogleSubmitting ? 'Connexion...' : <><GoogleIcon /> Continuer avec Google</>}
             </Button>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Ou continuer avec</span>
                </div>
            </div>

            <Form {...emailForm}>
              <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
                <FormField
                  control={emailForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl><Input type="email" placeholder="votre@email.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={emailForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mot de passe</FormLabel>
                      <div className="relative">
                        <FormControl>
                            <Input 
                                type={showPassword ? 'text' : 'password'} 
                                placeholder="••••••••" 
                                {...field} 
                                className="pr-10"
                            />
                        </FormControl>
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                            aria-label={showPassword ? "Cacher le mot de passe" : "Afficher le mot de passe"}
                        >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isSubmitting || isGoogleSubmitting}>
                  {isSubmitting ? 'Connexion...' : 'Se connecter'}
                </Button>
              </form>
            </Form>
        </div>
        <p className="text-center text-sm text-muted-foreground mt-6">
          Pas encore de compte ?{' '}
          <Link href="/signup" className="underline text-primary hover:text-primary/80 font-semibold">
            Créer un compte
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
