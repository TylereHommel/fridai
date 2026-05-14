import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ExpiryBadge } from './ExpiryBadge';
import { useTheme } from '../../hooks/useTheme';
import type { PantryItem } from '../../lib/pantry';

const CATEGORY_ICONS = { fridge: '🧊', freezer: '❄️', pantry: '🗄️' };

type Props = {
  item: PantryItem;
  onDelete: () => void;
  onPress: () => void;
};

export function PantryItemRow({ item, onDelete, onPress }: Props) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.row, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
      activeOpacity={0.75}
    >
      <Text style={styles.categoryIcon}>{CATEGORY_ICONS[item.category]}</Text>
      <View style={styles.middle}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
        <View style={styles.meta}>
          {item.quantity ? (
            <Text style={[styles.qty, { color: colors.textMuted }]}>{item.quantity}</Text>
          ) : null}
          <ExpiryBadge expiryDate={item.expiryDate} />
        </View>
      </View>
      <TouchableOpacity onPress={onDelete} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} style={styles.deleteBtn}>
        <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  categoryIcon: { fontSize: 22, marginRight: 12 },
  middle: { flex: 1, gap: 4 },
  name: { fontSize: 15, fontWeight: '500' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qty: { fontSize: 12 },
  deleteBtn: { paddingLeft: 12 },
});
