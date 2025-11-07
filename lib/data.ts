
'use client';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  Timestamp,
  Firestore
} from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { UserProfile, ProfileType } from './types';
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
const profileTypes: ProfileType[][] = [
    ['Amoureuse'],
    ['Amoureuse', 'Amicale'],
    ['Professionnelle'],
    ['Amoureuse', 'Professionnelle'],
    ['Amicale'],
    ['Amoureuse'],
    ['Amicale', 'Professionnelle'],
    ['Amoureuse'],
    ['Amicale'],
    ['Professionnelle'],
    ['Amoureuse', 'Amicale', 'Professionnelle'],
    ['Amoureuse'],
]

function getRandomItems<T>(arr: T[], count: number): T[] {
  return [...arr].sort(() => 0.5 - Math.random()).slice(0, count);
}

function getRandomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// In-memory cache for seeded profiles
let seededProfiles: UserProfile[] | null = null;

export function getSeededProfiles(): UserProfile[] {
  if (seededProfiles) {
    return seededProfiles;
  }

  const generatedProfiles: UserProfile[] = [];

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
    ];

  const allImageIds = imageIds.flat();
  const images = getPlaceholderImageByIds(allImageIds);
  const imageUrlMap = images.reduce((acc, img) => {
      acc[img.id] = img.imageUrl;
      return acc;
  }, {} as Record<string, string>);

  for (let i = 0; i < 12; i++) {
    const dob = getRandomDate(new Date(1980, 0, 1), new Date(2004, 0, 1));
    const age = new Date().getFullYear() - dob.getFullYear();
    const profilePictureUrls = imageIds[i].map(id => imageUrlMap[id]).filter(Boolean);

    const profile: UserProfile = {
      id: `seeded-user-${i + 1}`,
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
      profileTypes: profileTypes[i],
    };
    generatedProfiles.push(profile);
  }

  seededProfiles = generatedProfiles;
  return seededProfiles;
}


export function useProfiles() {
  const firestore = useFirestore();
  const profilesCollection = collection(firestore, 'users');

  const getProfiles = async () => {
    // This will fetch from firestore, but for the discover page we now use the local seed.
    const profilesSnapshot = await getDocs(profilesCollection);
    const profilesList = profilesSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as UserProfile));
    return profilesList;
  };

  return { getProfiles };
}

// Keep a local cache for Firestore profiles to reduce reads within the same session
const profileCache = new Map<string, UserProfile>();

export async function getProfileById(db: Firestore, id: string) : Promise<UserProfile | null> {
    if (profileCache.has(id)) {
        return profileCache.get(id) || null;
    }

    // If it's a seeded profile ID, get it from the local data
    if (id.startsWith('seeded-user-')) {
      return getSeededProfiles().find(p => p.id === id) || null;
    }

    // Otherwise, fetch from Firestore
    const profileDocRef = doc(db, 'users', id);
    const profileDoc = await getDoc(profileDocRef);
    if (profileDoc.exists()) {
        const profile = { id: profileDoc.id, ...profileDoc.data() } as UserProfile;
        profileCache.set(id, profile);
        return profile;
    }
    return null;
}


export async function checkIfProfileExists(db: Firestore, userId: string): Promise<boolean> {
    const profileDocRef = doc(db, 'users', userId);
    const profileDoc = await getDoc(profileDocRef);
    return profileDoc.exists();
}
