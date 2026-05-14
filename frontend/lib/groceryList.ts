import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, serverTimestamp, query, orderBy, Timestamp, writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';

export type GroceryItem = {
  id: string;
  name: string;
  quantity: string | null;
  checked: boolean;
  addedAt: Timestamp;
  sourceRecipeId: string | null;
};

export function subscribeToGroceryList(uid: string, cb: (items: GroceryItem[]) => void): () => void {
  const q = query(collection(db, 'users', uid, 'groceryList'), orderBy('addedAt', 'asc'));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as GroceryItem)));
  });
}

export async function addGroceryItem(uid: string, item: Omit<GroceryItem, 'id' | 'addedAt'>): Promise<string> {
  const ref = await addDoc(collection(db, 'users', uid, 'groceryList'), {
    ...item,
    addedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function toggleGroceryItem(uid: string, itemId: string, checked: boolean): Promise<void> {
  await updateDoc(doc(db, 'users', uid, 'groceryList', itemId), { checked });
}

export async function deleteGroceryItem(uid: string, itemId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'groceryList', itemId));
}

export async function clearCheckedItems(uid: string, items: GroceryItem[]): Promise<void> {
  const batch = writeBatch(db);
  items.filter((i) => i.checked).forEach((i) => {
    batch.delete(doc(db, 'users', uid, 'groceryList', i.id));
  });
  await batch.commit();
}

export async function addIngredientsFromRecipe(
  uid: string,
  recipeId: string,
  ingredients: { name: string; amount: string; inPantry: boolean }[]
): Promise<void> {
  const missing = ingredients.filter((i) => !i.inPantry);
  await Promise.all(missing.map((i) =>
    addGroceryItem(uid, {
      name: i.name,
      quantity: i.amount,
      checked: false,
      sourceRecipeId: recipeId,
    })
  ));
}
