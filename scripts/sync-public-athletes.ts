import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

const PUBLIC_FIELDS = [
  'name',
  'avatar',
  'sport',
  'position',
  'age',
  'heightCm',
  'weightKg',
  'city',
  'province',
  'level',
  'preferredFootOrHand',
  'bio',
  'stats',
  'availableForTrials',
  'isPremium',
  'isVerified',
  'rating',
  'verificationTier',
  'activityLevel',
  'avgResponseMinutes',
] as const;

function sanitizeAthlete(data: FirebaseFirestore.DocumentData) {
  const publicData: Record<string, unknown> = {};
  for (const field of PUBLIC_FIELDS) {
    if (data[field] !== undefined) publicData[field] = data[field];
  }
  return publicData;
}

async function main() {
  const snapshot = await db.collection('athletes').get();
  const batch = db.batch();

  for (const athlete of snapshot.docs) {
    const publicRef = db.collection('publicAthletes').doc(athlete.id);
    batch.set(publicRef, {
      ...sanitizeAthlete(athlete.data()),
      sourceAthleteId: athlete.id,
      published: athlete.data().availableForTrials !== false,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  }

  if (!snapshot.empty) await batch.commit();
  console.log(`Synchronized ${snapshot.size} athlete public projections.`);
}

main().catch((error) => {
  console.error('Public athlete projection sync failed:', error);
  process.exitCode = 1;
});
