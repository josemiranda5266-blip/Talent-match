import { collection, db, getDocs } from '../lib/firebase';
import { Athlete } from '../types';
import { INITIAL_ATHLETES } from '../data/mockData';

export interface PublicAthleteFilters {
  sport?: string;
  province?: string;
  city?: string;
  position?: string;
  minAge?: number;
  maxAge?: number;
  level?: string;
  availableOnly?: boolean;
}

/**
 * Public scouting reads must use the sanitized publicAthletes projection.
 * Canonical athlete documents remain private and are never listed by clients.
 */
export async function fetchPublicAthletes(filters?: PublicAthleteFilters): Promise<Athlete[]> {
  try {
    const snapshot = await getDocs(collection(db, 'publicAthletes'));
    let list: Athlete[] = snapshot.docs.map((snapshotDoc) => ({
      id: snapshotDoc.id,
      ...snapshotDoc.data(),
    } as Athlete));

    if (!list.length && import.meta.env.VITE_DEMO_MODE === 'true') {
      list = [...INITIAL_ATHLETES];
    }

    if (filters) {
      if (filters.sport && filters.sport !== 'Todos') {
        list = list.filter((athlete) => athlete.sport.toLowerCase() === filters.sport!.toLowerCase());
      }
      if (filters.province && filters.province !== 'Todas') {
        list = list.filter((athlete) => athlete.province.toLowerCase().includes(filters.province!.toLowerCase()));
      }
      if (filters.city?.trim()) {
        list = list.filter((athlete) => athlete.city.toLowerCase().includes(filters.city!.trim().toLowerCase()));
      }
      if (filters.position && filters.position !== 'Todas') {
        list = list.filter((athlete) => athlete.position.toLowerCase().includes(filters.position!.toLowerCase()));
      }
      if (filters.level && filters.level !== 'Todos') {
        list = list.filter((athlete) => athlete.level === filters.level);
      }
      if (filters.minAge !== undefined) {
        list = list.filter((athlete) => athlete.age >= filters.minAge!);
      }
      if (filters.maxAge !== undefined) {
        list = list.filter((athlete) => athlete.age <= filters.maxAge!);
      }
      if (filters.availableOnly) {
        list = list.filter((athlete) => athlete.availableForTrials === true);
      }
    }

    return list;
  } catch (error) {
    console.error('Error fetching public athletes:', error);
    if (import.meta.env.VITE_DEMO_MODE === 'true') return INITIAL_ATHLETES;
    throw error;
  }
}
