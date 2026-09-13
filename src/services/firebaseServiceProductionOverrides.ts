import {
  auth,
  db,
  doc,
  getDoc,
  setDoc,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
} from '../lib/firebase';
import { saveAthleteProfile as legacySaveAthleteProfile } from './firebaseServiceLegacy';
import type { Athlete, UserRole } from '../types';
import type { UserProfile } from './firebaseServiceLegacy';

function normalizeRole(role: UserRole | 'admin'): Exclude<UserRole, 'admin'> {
  return role === 'admin' ? 'athlete' : role;
}

export async function registerUser(
  email: string,
  pass: string,
  displayName: string,
  role: UserRole | 'admin',
  phone: string = '',
  city: string = '',
  province: string = '',
  selectedCategory: string = 'Deportista'
): Promise<UserProfile> {
  const safeRole = normalizeRole(role);
  const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
  const user = userCredential.user;
  if (displayName) await updateProfile(user, { displayName });

  const profile: UserProfile = {
    uid: user.uid,
    email: user.email || email,
    displayName: displayName || email.split('@')[0] || email,
    role: safeRole,
    phone,
    city,
    province,
    selectedCategory,
    verificationStatus: 'none',
    createdAt: new Date().toISOString(),
  };
  await setDoc(doc(db, 'users', user.uid), profile);

  if (safeRole === 'athlete') {
    const newAthlete: Athlete = {
      id: user.uid,
      name: displayName || 'Deportista TalentMatch',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      sport: 'Fútbol',
      position: 'Por definir',
      age: 20,
      heightCm: 175,
      weightKg: 70,
      city: city || 'Santiago del Estero',
      province: province || 'Santiago del Estero',
      level: 'Amateur',
      preferredFootOrHand: 'Diestro',
      bio: 'Deportista registrado en TalentMatch listo para pruebas.',
      stats: { matchesPlayed: 0, goalsOrPoints: 0, achievements: [] },
      availableForTrials: true,
      isPremium: false,
      isVerified: false,
      contactEmail: email,
      contactPhone: phone,
      rating: 5.0,
    };
    await setDoc(doc(db, 'athletes', user.uid), { ...newAthlete, userId: user.uid });
  }
  return profile;
}

export async function loginWithGoogle(
  role: UserRole | 'admin' = 'athlete',
  selectedCategory: string = 'Deportista'
): Promise<UserProfile> {
  const safeRole = normalizeRole(role);
  const result = await signInWithPopup(auth, new GoogleAuthProvider());
  const user = result.user;
  const snapshot = await getDoc(doc(db, 'users', user.uid));
  if (snapshot.exists()) return snapshot.data() as UserProfile;

  const profile: UserProfile = {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || 'Usuario Google',
    role: safeRole,
    photoURL: user.photoURL || undefined,
    selectedCategory,
    verificationStatus: 'none',
    createdAt: new Date().toISOString(),
  };
  await setDoc(doc(db, 'users', user.uid), profile);

  if (safeRole === 'athlete') {
    const newAthlete: Athlete = {
      id: user.uid,
      name: user.displayName || 'Deportista TalentMatch',
      avatar: user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      sport: 'Fútbol',
      position: 'Por definir',
      age: 20,
      heightCm: 175,
      weightKg: 70,
      city: 'Santiago del Estero',
      province: 'Santiago del Estero',
      level: 'Amateur',
      preferredFootOrHand: 'Diestro',
      bio: 'Deportista registrado con Google listo para pruebas.',
      stats: { matchesPlayed: 0, goalsOrPoints: 0, achievements: [] },
      availableForTrials: true,
      isPremium: false,
      isVerified: false,
      contactEmail: user.email || '',
      contactPhone: '',
      rating: 5.0,
    };
    await setDoc(doc(db, 'athletes', user.uid), { ...newAthlete, userId: user.uid });
  }
  return profile;
}

export async function saveAthleteProfile(athlete: Athlete): Promise<void> {
  await legacySaveAthleteProfile(athlete);
  await setDoc(doc(db, 'athletes', athlete.id), { userId: athlete.id }, { merge: true });
}
