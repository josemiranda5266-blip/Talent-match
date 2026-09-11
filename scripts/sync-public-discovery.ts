import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue, type DocumentData } from 'firebase-admin/firestore';

if (!getApps().length) {
  initializeApp();
}

const db = getFirestore();
const BATCH_SIZE = 450;

type SourceDefinition = {
  source: 'searches' | 'teams' | 'tournaments';
  target: 'publicSearches' | 'publicTeams' | 'publicTournaments';
  fields: readonly string[];
};

const SOURCES: SourceDefinition[] = [
  {
    source: 'searches',
    target: 'publicSearches',
    fields: [
      'clubName', 'clubLogo', 'title', 'sport', 'categoryNeeded', 'positionNeeded',
      'minAge', 'maxAge', 'city', 'province', 'levelRequired', 'trialDate', 'trialTime',
      'locationDetails', 'description', 'requirements', 'salaryOrRemuneration',
      'isFeatured', 'postedAt', 'applicantCount', 'status',
    ],
  },
  {
    source: 'teams',
    target: 'publicTeams',
    fields: [
      'name', 'category', 'sport', 'logoUrl', 'city', 'province', 'address', 'lat', 'lng',
      'description', 'schedule', 'contactWhatsApp', 'contactInstagram',
      'lookingForPlayers', 'lookingForFriendlies', 'isFreeListing', 'isVerified',
      'createdAt', 'memberCount',
    ],
  },
  {
    source: 'tournaments',
    target: 'publicTournaments',
    fields: [
      'title', 'organizerName', 'sport', 'category', 'province', 'city', 'venueName',
      'startDate', 'endDate', 'description', 'prizes', 'registrationFee', 'registrationLink',
      'contactWhatsApp', 'contactInstagram', 'contactEmail', 'bannerImage',
      'isVerifiedOrganizer', 'createdAt', 'status',
    ],
  },
];

function sanitize(data: DocumentData, fields: readonly string[]) {
  const result: Record<string, unknown> = {};
  for (const field of fields) {
    if (data[field] !== undefined) result[field] = data[field];
  }
  return result;
}

async function syncSource(definition: SourceDefinition) {
  const [sourceSnapshot, targetSnapshot] = await Promise.all([
    db.collection(definition.source).get(),
    db.collection(definition.target).get(),
  ]);

  const sourceIds = new Set(sourceSnapshot.docs.map((document) => document.id));

  for (let offset = 0; offset < sourceSnapshot.docs.length; offset += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = sourceSnapshot.docs.slice(offset, offset + BATCH_SIZE);

    for (const sourceDoc of chunk) {
      const sourceData = sourceDoc.data();
      batch.set(
        db.collection(definition.target).doc(sourceDoc.id),
        {
          ...sanitize(sourceData, definition.fields),
          // Keep the publication gate explicit so an unpublished source can
          // never become visible merely because the sync job ran.
          published: sourceData.published === false ? false : true,
          updatedAt: FieldValue.serverTimestamp(),
        },
        // Full replacement prevents fields removed from the allowlist/source
        // from lingering in an older public projection.
        { merge: false },
      );
    }

    if (chunk.length > 0) await batch.commit();
  }

  for (let offset = 0; offset < targetSnapshot.docs.length; offset += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = targetSnapshot.docs.slice(offset, offset + BATCH_SIZE);
    let deletes = 0;

    for (const targetDoc of chunk) {
      if (!sourceIds.has(targetDoc.id)) {
        batch.delete(targetDoc.ref);
        deletes += 1;
      }
    }

    if (deletes > 0) await batch.commit();
  }

  console.log(
    `${definition.source} -> ${definition.target}: synchronized ${sourceSnapshot.size}; stale projections removed where necessary.`,
  );
}

async function main() {
  for (const definition of SOURCES) {
    await syncSource(definition);
  }
}

main().catch((error) => {
  console.error('Public discovery synchronization failed:', error);
  process.exitCode = 1;
});
