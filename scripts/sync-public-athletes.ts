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
  const docs = snapshot.docs;

  for (let offset = 0; offset < docs.length; offset += 450) {
    const batch = db.batch();
    const chunk = docs.slice(offset, offset + 450);

    for (const athlete of chunk) {
      const data = athlete.data();
      const publicRef = db.collection('publicAthletes').doc(athlete.id);
      batch.set(publicRef, {
        ...sanitizeAthlete(data),
        sourceAthleteId: athlete.id,
        published: data.availableForTrials !== false,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    }

    if (chunk.length > 0) await batch.commit();
  }

  console.log(`Synchronized ${docs.length} athlete public projections.`);
}

main().catch((error) => {
  console.error('Public athlete projection sync failed:', error);
  process.exitCode = 1;
});
