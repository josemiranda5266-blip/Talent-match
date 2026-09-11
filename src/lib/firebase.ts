import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  limit,
  increment
} from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import firebaseConfigData from '../../firebase-applet-config.json';

const requireFirebaseConfigValue = (key: keyof typeof firebaseConfigData): string => {
  const value = firebaseConfigData[key];
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Firebase configuration is missing required field: ${String(key)}`);
  }
  return value;
};

const firebaseConfig = {
  apiKey: requireFirebaseConfigValue('apiKey'),
  authDomain: requireFirebaseConfigValue('authDomain'),
  projectId: requireFirebaseConfigValue('projectId'),
  storageBucket: requireFirebaseConfigValue('storageBucket'),
  messagingSenderId: requireFirebaseConfigValue('messagingSenderId'),
  appId: requireFirebaseConfigValue('appId'),
};

// Initialize App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore with custom databaseId if configured
const databaseId = firebaseConfigData.firestoreDatabaseId;
export const db = typeof databaseId === 'string' && databaseId.trim()
  ? getFirestore(app, databaseId)
  : getFirestore(app);

// Initialize Storage
let storageInstance: ReturnType<typeof getStorage> | null = null;
try {
  storageInstance = getStorage(app);
} catch (err) {
  console.warn('Firebase storage initialization warning:', err);
}
export const storage = storageInstance;

export {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  limit,
  increment,
  ref,
  uploadBytesResumable,
  getDownloadURL
};
export type { FirebaseUser };
