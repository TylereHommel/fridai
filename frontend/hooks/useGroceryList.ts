import { useState, useEffect } from 'react';
import {
  GroceryItem, subscribeToGroceryList, addGroceryItem,
  toggleGroceryItem, deleteGroceryItem, clearCheckedItems,
} from '../lib/groceryList';
import { useAuth } from './useAuth';

export function useGroceryList() {
  const { user } = useAuth();
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToGroceryList(user.uid, (i) => {
      setItems(i);
      setLoading(false);
    });
    return unsub;
  }, [user?.uid]);

  async function add(name: string, quantity?: string, sourceRecipeId?: string) {
    if (!user) return;
    await addGroceryItem(user.uid, {
      name: name.trim(),
      quantity: quantity?.trim() ?? null,
      checked: false,
      sourceRecipeId: sourceRecipeId ?? null,
    });
  }

  async function toggle(itemId: string, checked: boolean) {
    if (!user) return;
    await toggleGroceryItem(user.uid, itemId, checked);
  }

  async function remove(itemId: string) {
    if (!user) return;
    await deleteGroceryItem(user.uid, itemId);
  }

  async function clearChecked() {
    if (!user) return;
    await clearCheckedItems(user.uid, items);
  }

  const checkedCount = items.filter((i) => i.checked).length;

  return { items, loading, add, toggle, remove, clearChecked, checkedCount };
}
