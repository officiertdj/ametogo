'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { CalendarIcon, Check } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { UserProfile, ProfileType } from '@/lib/types';
import { PhotoUploader } from './photo-uploader';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, setDocumentNonBlocking } from '@/firebase';
import { doc, Timestamp } from 'firebase/firestore';
import { Checkbox } from '../ui/checkbox';

const profileFormSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Le prénom doit faire au moins 2 caractères.' })
    .max(50, { message: 'Le prénom ne peut pas dépasser 50 caractères.' }),
  dob: z.date({ required_error: 'Votre date de naissance est requise.' }),
  city: z.string({ required_error: 'Veuillez sélectionner votre ville.' }),
  gender: z.string({ required_error: 'Veuillez sélectionner votre genre.' }),
  passions: z
    .array(z.string())
    .min(1, { message: 'Veuillez choisir au moins une passion.' })
    .max(5, { message: 'Vous pouvez choisir jusqu\'à 5 passions.' }),
  bio: z
    .string()
    .max(300, { message: 'Votre bio ne peut pas dépasser 300 caractères.' })
    .optional(),
  profilePictureUrls: z
    .array(z.string())
    .min(3, { message: 'Veuillez ajouter au moins 3 photos.' }),
  profileTypes: z
    .array(z.string())
    .refine(value => value.some(item => item), {
      message: 'Vous devez sélectionner au moins un type de rencontre.',
    }),
});

const allPassions = [
  'Cuisine',
  'Danse',
  'Voyages',
  'Football',
  'Musique',
  'Cinéma',
  'Lecture',
  'Randonnée',
  'Art',
  'Technologie',
  'Jeux vidéo',
  'Nature',
  'Yoga',
  'Photographie',
  'Entrepreneuriat',
  'Fitness',
  'Plage',
  'Mode',
  'Histoire',
  'Animaux',
];
const cities = [
  'Lomé',
  'Kara',
  'Sokodé',
  'Kpalimé',
  'Atakpamé',
  'Dapaong',
  'Tsévié',
  'Aného',
];
const availableProfileTypes: { id: ProfileType; label: string }[] = [
  { id: 'Amoureuse', label: 'Amoureuse' },
  { id: 'Amicale', label: 'Amicale' },
  { id: 'Professionnelle', label: 'Professionnelle' },
];

interface ProfileFormProps {
  user?: Partial<UserProfile> | null;
}

export function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user: authUser } = useUser();
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name:
        user?.name || authUser?.displayName?.split(' ')[0] || '',
      dob: user?.dob ? (user.dob as Timestamp).toDate() : undefined,
      city: user?.city || '',
      gender: user?.gender || '',
      passions: user?.passions || [],
      bio: user?.bio || '',
      profilePictureUrls:
        user?.profilePictureUrls ||
        (authUser?.photoURL ? [authUser.photoURL] : []),
      profileTypes: user?.profileTypes || [],
    },
  });

  async function onSubmit(values: z.infer<typeof profileFormSchema>) {
    if (!authUser) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Vous n\'êtes pas connecté.',
      });
      return;
    }

    const age = new Date().getFullYear() - values.dob.getFullYear();

    // In a real app, you'd upload the base64 images to a storage service (e.g., Firebase Storage)
    // and get back URLs. For now, we're assuming the base64 strings are the URLs for simplicity.
    const profileData = {
      ...values,
      id: authUser.uid,
      email: authUser.email,
      age,
      // photoIds are now the base64 URLs
      photoIds: values.profilePictureUrls,
      accountStatus: 'active',
    };

    const userDocRef = doc(firestore, 'users', authUser.uid);

    setDocumentNonBlocking(userDocRef, profileData, { merge: true });

    toast({
      title: 'Profil sauvegardé !',
      description: 'Votre profil a été mis à jour avec succès.',
    });

    router.push('/decouvrir');
  }

  function togglePassion(passion: string) {
    const currentPassions = form.getValues('passions');
    const newPassions = currentPassions.includes(passion)
      ? currentPassions.filter(p => p !== passion)
      : [...currentPassions, passion];

    if (newPassions.length <= 5) {
      form.setValue('passions', newPassions, { shouldValidate: true });
    } else {
      toast({
        variant: 'destructive',
        title: 'Trop de passions',
        description: 'Vous ne pouvez sélectionner que 5 passions au maximum.',
      });
    }
  }

  const selectedPassions = form.watch('passions');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="profileTypes"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel>Types de rencontres recherchés</FormLabel>
                <FormDescription>
                  Sélectionnez les types de relations que vous recherchez sur
                  AméTogo.
                </FormDescription>
              </div>
              <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
                {availableProfileTypes.map(item => (
                  <FormField
                    key={item.id}
                    control={form.control}
                    name="profileTypes"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={item.id}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(item.id)}
                              onCheckedChange={checked => {
                                return checked
                                  ? field.onChange([...field.value, item.id])
                                  : field.onChange(
                                      field.value?.filter(
                                        value => value !== item.id
                                      )
                                    );
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {item.label}
                          </FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid md:grid-cols-2 gap-8">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prénom ou pseudo</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Koffi" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dob"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date de naissance</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={'outline'}
                        className={cn(
                          'pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? (
                          format(field.value, 'PPP', { locale: fr })
                        ) : (
                          <span>Choisir une date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      captionLayout="dropdown-buttons"
                      fromYear={1950}
                      toYear={new Date().getFullYear() - 18}
                      disabled={date =>
                        date >
                        new Date(
                          new Date().setFullYear(new Date().getFullYear() - 18)
                        )
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Genre</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez votre genre" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Homme">Homme</SelectItem>
                    <SelectItem value="Femme">Femme</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ville</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez votre ville" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {cities.map(city => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="passions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Passions</FormLabel>
              <FormDescription>
                Choisissez jusqu'à 5 passions qui vous décrivent le mieux.
              </FormDescription>
              <div className="flex flex-wrap gap-2">
                {allPassions.map(passion => (
                  <Badge
                    key={passion}
                    variant={
                      selectedPassions.includes(passion)
                        ? 'default'
                        : 'secondary'
                    }
                    onClick={() => togglePassion(passion)}
                    className="cursor-pointer transition-transform hover:scale-105"
                  >
                    {selectedPassions.includes(passion) && (
                      <Check className="mr-1 h-3 w-3" />
                    )}
                    {passion}
                  </Badge>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Courte bio (optionnel)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Parlez un peu de vous..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="profilePictureUrls"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vos photos</FormLabel>
              <FormDescription>
                Ajoutez au moins 3 photos. La première sera votre photo de
                couverture.
              </FormDescription>
              <FormControl>
                <PhotoUploader
                  initialPhotos={field.value}
                  onPhotosChange={photos => field.onChange(photos)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" size="lg" className="w-full md:w-auto">
          {user ? 'Sauvegarder les modifications' : 'Créer mon profil'}
        </Button>
      </form>
    </Form>
  );
}
