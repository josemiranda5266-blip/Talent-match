import { db, doc, setDoc } from '../lib/firebase';
import {
  registerUser as legacyRegisterUser,
  loginWithGoogle as legacyLoginWithGoogle,
  saveAthleteProfile as legacySaveAthleteProfile,
} from './firebaseServiceLegacy';
import type { Athlete, UserRole } from '../types';

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
  const profile = await legacyRegisterUser(
    email,
    pass,
    displayName,
    role,
    phone,
    city,
    province,
    selectedCategory
  );

  if (profile.role === 'athlete') {
    await setDoc(doc(db, 'athletes', profile.uid), { userId: profile.uid }, { merge: true });
  }

  return profile;
}

export async function loginWithGoogle(
  role: UserRole | 'admin' = 'athlete',
  selectedCategory: string = 'Deportista'
) {
  const profile = await legacyLoginWithGoogle(role, selectedCategory);

  if (profile.role === 'athlete') {
    await setDoc(doc(db, 'athletes', profile.uid), { userId: profile.uid }, { merge: true });
  }

  return profile;
}

export async function saveAthleteProfile(athlete: Athlete): Promise<void> {
  await legacySaveAthleteProfile({ ...athlete, userId: athlete.userId || athlete.id });
}
