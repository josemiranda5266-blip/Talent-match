import { collection, db, getDocs } from '../lib/firebase';
import { Athlete, ClubSearch, FreeTeamProfile, Tournament } from '../types';
import { INITIAL_ATHLETES, INITIAL_SEARCHES, INITIAL_FREE_TEAMS, INITIAL_TOURNAMENTS } from '../data/mockData';

export interface AthleteDiscoveryFilters {
  sport?: string;
  province?: string;
  city?: string;
  position?: string;
  minAge?: number;
  maxAge?: number;
  level?: string;
  availableOnly?: boolean;
}

/** Public directory reads use sanitized projection collections only. */
export async function fetchPublicAthletes(filters?: AthleteDiscoveryFilters): Promise<Athlete[]> {
  try {
    const snapshot = await getDocs(collection(db, 'publicAthletes'));
    let list: Athlete[] = snapshot.docs
      .filter((snapshotDoc) => snapshotDoc.data().published !== false)
      .map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() } as Athlete));
    list = list.filter((athlete) => athlete.availableForTrials !== false);
    return filterAthletes(list, filters);
  } catch (error) {
    console.error('Error fetching public athlete discovery data:', error);
    if (isDemoMode()) return filterAthletes([...INITIAL_ATHLETES], filters);
    throw error;
  }
}

export async function fetchPublicClubSearches(): Promise<ClubSearch[]> {
  try {
    const snapshot = await getDocs(collection(db, 'publicSearches'));
    return snapshot.docs
      .filter((snapshotDoc) => snapshotDoc.data().published !== false)
      .map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() } as ClubSearch));
  } catch (error) {
    console.error('Error fetching public club searches:', error);
    if (isDemoMode()) return [...INITIAL_SEARCHES];
    throw error;
  }
}

export async function fetchPublicTeams(): Promise<FreeTeamProfile[]> {
  try {
    const snapshot = await getDocs(collection(db, 'publicTeams'));
    return snapshot.docs
      .filter((snapshotDoc) => snapshotDoc.data().published !== false)
      .map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() } as FreeTeamProfile));
  } catch (error) {
    console.error('Error fetching public teams:', error);
    if (isDemoMode()) return [...INITIAL_FREE_TEAMS];
    throw error;
  }
}

export async function fetchPublicTournaments(): Promise<Tournament[]> {
  try {
    const snapshot = await getDocs(collection(db, 'publicTournaments'));
    return snapshot.docs
      .filter((snapshotDoc) => snapshotDoc.data().published !== false)
      .map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() } as Tournament));
  } catch (error) {
    console.error('Error fetching public tournaments:', error);
    if (isDemoMode()) return [...INITIAL_TOURNAMENTS];
    throw error;
  }
}

function filterAthletes(list: Athlete[], filters?: AthleteDiscoveryFilters): Athlete[] {
  if (!filters) return list;
  if (filters.sport && filters.sport !== 'Todos') list = list.filter((athlete) => athlete.sport?.toLowerCase() === filters.sport!.toLowerCase());
  if (filters.province && filters.province !== 'Todas') list = list.filter((athlete) => athlete.province?.toLowerCase().includes(filters.province!.toLowerCase()));
  if (filters.city?.trim()) list = list.filter((athlete) => athlete.city?.toLowerCase().includes(filters.city!.trim().toLowerCase()));
  if (filters.position && filters.position !== 'Todas') list = list.filter((athlete) => athlete.position?.toLowerCase().includes(filters.position!.toLowerCase()));
  if (filters.level && filters.level !== 'Todos') list = list.filter((athlete) => athlete.level === filters.level);
  if (filters.minAge !== undefined) list = list.filter((athlete) => athlete.age >= filters.minAge!);
  if (filters.maxAge !== undefined) list = list.filter((athlete) => athlete.age <= filters.maxAge!);
  if (filters.availableOnly) list = list.filter((athlete) => athlete.availableForTrials === true);
  return list;
}

function isDemoMode(): boolean {
  const envDemo = (import.meta as any).env?.VITE_DEMO_MODE;
  if (envDemo === 'true' || envDemo === true) return true;
  if (envDemo === 'false' || envDemo === false) return false;
  return !(import.meta as any).env?.PROD;
}
