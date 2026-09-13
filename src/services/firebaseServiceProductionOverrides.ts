import {
  auth,
  db,
  doc,
  setDoc,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
} from '../lib/firebase';
import { saveAthleteProfile as legacySaveAthleteProfile } from './firebaseServiceLegacy';
import type { Athlete, UserRole } from '../types';

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
) {
  const safeRole = normalizeRole(role);
  const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
  const user = userCredential.user;

  if (displayName) await updateProfile(user, { displayName });

  // Keep client-created profiles free of privileged/trust fields. Premium and verification
  // entitlements are server/admin controlled by Firestore rules and backend workflows.
  const profile = {
    uid: user.uid,
    email: user.email || email,
    displayName: displayName || email.split('@')[0] || email,
    role: safeRole,
    phone,
    city,
    province,
    selectedCategory,
    verificationStatus: 'none' as const,
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
) {
  const safeRole = normalizeRole(role);
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  const existing = await (async () => {
    const snapshot = await import('../lib/firebase').then(({ getDoc }) => getDoc(doc(db, 'users', user.uid)));
    return snapshot.exists() ? snapshot.data() : null;
  })();
  if (existing) return existing;

  const profile = {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || 'Usuario Google',
    role: safeRole,
    photoURL: user.photoURL || undefined,
    selectedCategory,
    verificationStatus: 'none' as const,
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
