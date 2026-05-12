import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

export type UserDoc = {
  email: string;
  displayName: string;
  dietaryRestrictions: string[];
  cuisinePreferences: string[];
  sessionCount: number;
  sessionResetDate: Date | null;
  subscriptionTier: 'free' | 'pro';
  themeColor: string;
  darkMode: boolean;
  createdAt: Date | null;
};

export async function createUserDoc(
  uid: string,
  data: Pick<UserDoc, 'email' | 'displayName'>
): Promise<void> {
  const ref = doc(db, 'users', uid);
  const existing = await getDoc(ref);
  if (existing.exists()) return;

  await setDoc(ref, {
    email: data.email,
    displayName: data.displayName,
    dietaryRestrictions: [],
    cuisinePreferences: [],
    sessionCount: 0,
    sessionResetDate: null,
    subscriptionTier: 'free',
    themeColor: 'forest',
    darkMode: false,
    createdAt: serverTimestamp(),
  });
}

export async function getUserDoc(uid: string): Promise<UserDoc | null> {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as UserDoc;
}

export async function updateUserDoc(
  uid: string,
  data: Partial<UserDoc>
): Promise<void> {
  const ref = doc(db, 'users', uid);
  await updateDoc(ref, data as Record<string, unknown>);
}
