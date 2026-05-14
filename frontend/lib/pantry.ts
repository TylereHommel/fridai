import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, serverTimestamp, Timestamp, query, orderBy,
} from 'firebase/firestore';
import { db } from './firebase';

export type PantryCategory = 'fridge' | 'freezer' | 'pantry';

export type PantryItem = {
  id: string;
  name: string;
  category: PantryCategory;
  expiryDate: Timestamp | null;
  quantity: string;
  addedFromSessionId: string | null;
  addedAt: Timestamp;
  lastUpdatedAt: Timestamp;
  notificationIds: string[];
  barcodeData: string | null;
};

export type ExpiryStatus = 'expired' | 'today' | 'soon' | 'ok' | 'none';

export function getExpiryStatus(item: Pick<PantryItem, 'expiryDate'>): ExpiryStatus {
  if (!item.expiryDate) return 'none';
  const now = new Date();
  const expiry = item.expiryDate.toDate();
  const diffDays = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays < 0) return 'expired';
  if (diffDays < 1) return 'today';
  if (diffDays <= 7) return 'soon';
  return 'ok';
}

export function subscribeToPantry(uid: string, cb: (items: PantryItem[]) => void): () => void {
  const q = query(collection(db, 'users', uid, 'pantry'), orderBy('addedAt', 'desc'));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as PantryItem)));
  });
}

export async function addPantryItem(
  uid: string,
  item: Omit<PantryItem, 'id' | 'addedAt' | 'lastUpdatedAt' | 'notificationIds'>
): Promise<string> {
  const ref = await addDoc(collection(db, 'users', uid, 'pantry'), {
    ...item,
    notificationIds: [],
    addedAt: serverTimestamp(),
    lastUpdatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updatePantryItem(
  uid: string,
  itemId: string,
  partial: Partial<Omit<PantryItem, 'id' | 'addedAt'>>
): Promise<void> {
  await updateDoc(doc(db, 'users', uid, 'pantry', itemId), {
    ...partial,
    lastUpdatedAt: serverTimestamp(),
  });
}

export async function deletePantryItem(uid: string, itemId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'pantry', itemId));
}
