import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

export async function uploadPhoto(localUri: string, userId: string): Promise<string> {
  const filename = `scans/${userId}/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
  const storageRef = ref(storage, filename);

  const response = await fetch(localUri);
  const blob = await response.blob();
  await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
  return getDownloadURL(storageRef);
}

export async function uploadPhotos(localUris: string[], userId: string): Promise<string[]> {
  return Promise.all(localUris.map((uri) => uploadPhoto(uri, userId)));
}
