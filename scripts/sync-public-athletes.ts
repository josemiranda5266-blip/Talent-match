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
  const [athleteSnapshot, publicSnapshot] = await Promise.all([
    db.collection('athletes').get(),
    db.collection('publicAthletes').get(),
  ]);

  const sourceIds = new Set(athleteSnapshot.docs.map((document) => document.id));
  const publicDocs = publicSnapshot.docs;

  // Upsert sanitized projections in chunks below Firestore's 500-operation limit.
  for (let offset = 0; offset < athleteSnapshot.docs.length; offset += 450) {
    const batch = db.batch();
    const chunk = athleteSnapshot.docs.slice(offset, offset + 450);

    for (const athlete of chunk) {
      const data = athlete.data();
      const publicRef = db.collection('publicAthletes').doc(athlete.id);
      batch.set(publicRef, {
        ...sanitizeAthlete(data),
        published: data.availableForTrials !== false,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    }

    if (chunk.length > 0) await batch.commit();
  }

  // Remove stale public projections after source records are deleted.
  for (let offset = 0; offset < publicDocs.length; offset += 450) {
    const batch = db.batch();
    const chunk = publicDocs.slice(offset, offset + 450);
    let deletes = 0;

    for (const publicDoc of chunk) {
      if (!sourceIds.has(publicDoc.id)) {
        batch.delete(publicDoc.ref);
        deletes += 1;
      }
    }

    if (deletes > 0) await batch.commit();
  }

  console.log(
    `Synchronized ${athleteSnapshot.size} athlete public projections; removed stale projections where necessary.`,
  );
}

main().catch((error) => {
  console.error('Public athlete projection sync failed:', error);
  process.exitCode = 1;
});
