// Compatibility facade: preserve the legacy service API while routing public
directory reads and media uploads through hardened implementations.
export * from './firebaseServiceLegacy';
export {
  registerUser,
  loginWithGoogle,
  saveAthleteProfile,
} from './firebaseServiceProductionOverrides';
export {
  fetchPublicAthletes as fetchAthletes,
  fetchPublicClubSearches as fetchClubSearches,
  fetchPublicTeams as fetchTeamsList,
  fetchPublicTournaments as fetchTournamentsList,
} from './publicDiscoveryService';
export { uploadMediaFile } from './secureMediaService';
