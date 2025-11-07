
'use server';
import { collection, writeBatch, Timestamp, doc } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { initializeFirebaseServer } from '@/firebase/config';
import type { UserProfile } from '@/lib/types';
import { getPlaceholderImageByIds } from './placeholder-images';

const names = [
  { name: 'Afi', gender: 'Femme' },
  { name: 'Koffi', gender: 'Homme' },
  { name: 'Akou', gender: 'Femme' },
  { name: 'Yao', gender: 'Homme' },
  { name: 'Ama', gender: 'Femme' },
  { name: 'Kwame', gender: 'Homme' },
  { name: 'Adjoa', gender: 'Femme' },
  { name: 'Kojo', gender: 'Homme' },
  { name: 'Esi', gender: 'Femme' },
  { name: 'Kwabena', gender: 'Homme' },
  { name: 'Abena', gender: 'Femme' },
  { name: 'Kweku', gender: 'Homme' },
];

const cities = ["Lomé", "Kara", "Sokodé", "Kpalimé", "Atakpamé", "Dapaong", "Tsévié", "Aného"];
const allPassions = ["Cuisine", "Danse", "Voyages", "Football", "Musique", "Cinéma", "Lecture", "Randonnée", "Art", "Technologie"];
const bios = [
  "Aime la vie et les nouvelles aventures.",
  "Passionné(e) de musique et de concerts live.",
  "Je cherche quelqu'un avec qui partager de bons repas et des rires.",
  "Le sport, c'est la vie. Surtout le football !",
  "Un bon livre et un café, c'est mon bonheur.",
  "Toujours prêt(e) pour un voyage improvisé.",
  "Cinéphile averti(e), je peux parler de films pendant des heures.",
  "J'adore explorer la nature et faire de la randonnée.",
];

function getRandomItems<T>(arr: T[], count: number): T[] {
  return [...arr].sort(() => 0.5 - Math.random()).slice(0, count);
}

function getRandomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

export async function seedDatabase() {
    const { firestore } = initializeFirebaseServer();
    if (!firestore) {
        console.error("Firestore not initialized");
        throw new Error("Firestore not initialized");
    }
  
    const batch = writeBatch(firestore);
    const usersCollection = collection(firestore, 'users');

    const imageIds = [
      ['user-1-1', 'user-1-2', 'user-1-3'],
      ['user-2-1', 'user-2-2', 'user-2-3'],
      ['user-3-1', 'user-3-2', 'user-3-3'],
      ['user-4-1', 'user-4-2', 'user-4-3'],
      ['user-5-1', 'user-5-2', 'user-5-3'],
      ['user-6-1', 'user-6-2', 'user-6-3'],
      ['user-7-1', 'user-7-2', 'user-7-3'],
      ['user-8-1', 'user-8-2', 'user-8-3'],
      ['user-9-1', 'user-9-2', 'user-9-3'],
      ['user-10-1', 'user-10-2', 'user-10-3'],
      ['user-11-1', 'user-11-2', 'user-11-3'],
      ['user-12-1', 'user-12-2', 'user-12-3'],
    ]

    const allImageIds = imageIds.flat();
    const images = getPlaceholderImageByIds(allImageIds);

    const imageUrlMap = images.reduce((acc, img) => {
        acc[img.id] = img.imageUrl;
        return acc;
    }, {} as Record<string, string>);


    for (let i = 0; i < 12; i++) {
        const userDocRef = doc(usersCollection); // Auto-generate ID
        const dob = getRandomDate(new Date(1980, 0, 1), new Date(2004, 0, 1));
        const age = new Date().getFullYear() - dob.getFullYear();
        
        const profilePictureUrls = imageIds[i].map(id => imageUrlMap[id]).filter(Boolean);

        const profile: UserProfile = {
            id: userDocRef.id,
            name: names[i].name,
            gender: names[i].gender as 'Homme' | 'Femme',
            city: getRandomItems(cities, 1)[0],
            dob: Timestamp.fromDate(dob),
            age: age,
            passions: getRandomItems(allPassions, Math.floor(Math.random() * 3) + 3),
            bio: getRandomItems(bios, 1)[0],
            profilePictureUrls: profilePictureUrls,
            photoIds: [],
            accountStatus: 'active',
        };
        batch.set(userDocRef, profile);
    }
  
    try {
      await batch.commit();
      console.log('Database seeded successfully with 12 profiles.');
      return { success: true, message: 'Database seeded successfully with 12 profiles.' };
    } catch (error) {
      console.error('Error seeding database:', error);
       return { success: false, message: `Error seeding database: ${error}` };
    }
}
