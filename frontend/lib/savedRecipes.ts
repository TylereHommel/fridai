import {
  collection, doc, query, orderBy, onSnapshot,
  deleteDoc, updateDoc, Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { RecipeResult } from './cloudFunctions';

export type SavedRecipe = RecipeResult & {
  savedAt: Timestamp;
  rating: number | null;
  isPublic: boolean;
  source: 'generated' | 'import';
  sourceUrl: string | null;
};

export function subscribeToSavedRecipes(uid: string, cb: (recipes: SavedRecipe[]) => void): () => void {
  const q = query(collection(db, 'users', uid, 'savedRecipes'), orderBy('savedAt', 'desc'));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ ...d.data(), id: d.id } as SavedRecipe)));
  });
}

export async function deleteSavedRecipe(uid: string, recipeId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'savedRecipes', recipeId));
}

export async function rateRecipe(uid: string, recipeId: string, rating: number): Promise<void> {
  await updateDoc(doc(db, 'users', uid, 'savedRecipes', recipeId), { rating });
}
