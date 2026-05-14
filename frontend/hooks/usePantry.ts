import { useState, useEffect } from 'react';
import {
  PantryItem, PantryCategory, subscribeToPantry,
  addPantryItem, updatePantryItem, deletePantryItem, getExpiryStatus,
} from '../lib/pantry';
import { scheduleExpiryNotifications, cancelNotifications } from '../lib/notifications';
import { useAuth } from './useAuth';

export type PantryGroups = Record<PantryCategory, PantryItem[]>;

function sortByExpiry(items: PantryItem[]): PantryItem[] {
  return [...items].sort((a, b) => {
    const sa = getExpiryStatus(a);
    const sb = getExpiryStatus(b);
    const order: Record<string, number> = { expired: 0, today: 1, soon: 2, ok: 3, none: 4 };
    if (order[sa] !== order[sb]) return order[sa] - order[sb];
    if (a.expiryDate && b.expiryDate) {
      return a.expiryDate.toMillis() - b.expiryDate.toMillis();
    }
    return 0;
  });
}

export function usePantry() {
  const { user } = useAuth();
  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToPantry(user.uid, (fetched) => {
      setItems(fetched);
      setLoading(false);
    });
    return unsub;
  }, [user?.uid]);

  const groups: PantryGroups = {
    fridge: sortByExpiry(items.filter((i) => i.category === 'fridge')),
    freezer: sortByExpiry(items.filter((i) => i.category === 'freezer')),
    pantry: sortByExpiry(items.filter((i) => i.category === 'pantry')),
  };

  async function add(item: Omit<PantryItem, 'id' | 'addedAt' | 'lastUpdatedAt' | 'notificationIds'>) {
    if (!user) return;
    const itemId = await addPantryItem(user.uid, item);
    if (item.expiryDate) {
      const ids = await scheduleExpiryNotifications(item.name, item.expiryDate.toDate());
      if (ids.length > 0) {
        await updatePantryItem(user.uid, itemId, { notificationIds: ids });
      }
    }
  }

  async function update(itemId: string, partial: Partial<Omit<PantryItem, 'id' | 'addedAt'>>) {
    if (!user) return;
    await updatePantryItem(user.uid, itemId, partial);
  }

  async function remove(itemId: string) {
    if (!user) return;
    const item = items.find((i) => i.id === itemId);
    if (item?.notificationIds?.length) {
      await cancelNotifications(item.notificationIds);
    }
    await deletePantryItem(user.uid, itemId);
  }

  return { items, groups, loading, add, update, remove };
}
