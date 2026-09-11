import { ref, storage, uploadBytesResumable, getDownloadURL } from '../lib/firebase';

/**
 * Production media uploads must use Firebase Storage. Returning Base64 data URLs
 * would inflate client memory and can accidentally persist large payloads in
 * Firestore documents. Fail explicitly when Storage is unavailable.
 */
export async function uploadMediaFile(file: File, folderPath: string): Promise<string> {
  if (!storage) {
    throw new Error('Firebase Storage no está disponible. No se puede subir el archivo.');
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storageRef = ref(storage, `${folderPath}/${Date.now()}_${safeName}`);

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      undefined,
      (error) => {
        console.error('Firebase Storage upload failed:', error);
        reject(new Error('No se pudo subir el archivo a Firebase Storage.'));
      },
      async () => {
        try {
          resolve(await getDownloadURL(uploadTask.snapshot.ref));
        } catch (error) {
          console.error('Firebase Storage download URL failed:', error);
          reject(new Error('El archivo se subió, pero no se pudo obtener su URL.'));
        }
      }
    );
  });
}
