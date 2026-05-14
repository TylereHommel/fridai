import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

export type DayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
export const DAY_KEYS: DayKey[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export type WeekPlan = {
  weekId: string;
  monday: string | null;
  tuesday: string | null;
  wednesday: string | null;
  thursday: string | null;
  friday: string | null;
  saturday: string | null;
  sunday: string | null;
};

export function getWeekId(date = new Date()): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
  d.setUTCDate(diff);
  return d.toISOString().slice(0, 10);
}

const EMPTY_WEEK = (weekId: string): WeekPlan => ({
  weekId,
  monday: null, tuesday: null, wednesday: null,
  thursday: null, friday: null, saturday: null, sunday: null,
});

export async function getWeekPlan(uid: string, weekId: string): Promise<WeekPlan> {
  const snap = await getDoc(doc(db, 'users', uid, 'weeklyPlan', weekId));
  if (!snap.exists()) return EMPTY_WEEK(weekId);
  return { weekId, ...snap.data() } as WeekPlan;
}

export async function setDayMeal(uid: string, weekId: string, day: DayKey, recipeId: string | null): Promise<void> {
  const ref = doc(db, 'users', uid, 'weeklyPlan', weekId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await updateDoc(ref, { [day]: recipeId });
  } else {
    await setDoc(ref, { ...EMPTY_WEEK(weekId), [day]: recipeId });
  }
}
