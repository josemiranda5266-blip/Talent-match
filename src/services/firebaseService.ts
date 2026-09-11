// Compatibility facade: keep the existing service API while routing public
// discovery and media uploads through hardened implementations.
export * from './firebaseServiceLegacy';
export { fetchPublicAthletes as fetchAthletes } from './publicDiscoveryService';
export { uploadMediaFile } from './secureMediaService';
