'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

// --- CONFIGURATION FIREBASE ---
// Les clés de votre projet Firebase sont maintenant intégrées ici.
const firebaseConfig = {
  apiKey: "AIzaSyDcbfJf2aHCshvUbPyELF9YI627zTYvUvA",
  authDomain: "studio-3045261680-a1873.firebaseapp.com",
  projectId: "studio-3045261680-a1873",
  storageBucket: "studio-3045261680-a1873.appspot.com",
  messagingSenderId: "22499439123",
  appId: "1:22499439123:web:77e323c2fca310620d05e6"
};
// -----------------------------------------------------------

let firebaseApp: FirebaseApp;
let auth: Auth;
let firestore: Firestore;

/**
 * Initialise et retourne les services Firebase de manière idempotente.
 * @returns {{ firebaseApp: FirebaseApp, auth: Auth, firestore: Firestore }}
 */
export function initializeFirebase() {
  if (!getApps().length) {
    firebaseApp = initializeApp(firebaseConfig);
    auth = getAuth(firebaseApp);
    firestore = getFirestore(firebaseApp);
  } else {
    firebaseApp = getApp();
    auth = getAuth(firebaseApp);
    firestore = getFirestore(firebaseApp);
  }
  return { firebaseApp, auth, firestore };
}

// Exportations des hooks et providers pour une utilisation dans l'application
export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './errors';
export * from './error-emitter';

// Ré-exportation des types pour éviter des imports lourds
export type { User } from 'firebase/auth';
export type { CollectionReference, DocumentReference, Query, DocumentData, Timestamp } from 'firebase/firestore';