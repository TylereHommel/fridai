import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import type { GroceryItem } from '../../lib/groceryList';

type Props = {
  item: GroceryItem;
  onToggle: () => void;
  onDelete: () => void;
};

export function GroceryListItem({ item, onToggle, onDelete }: Props) {
  const { colors } = useTheme();

  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <TouchableOpacity onPress={onToggle} style={styles.checkArea}>
        <View style={[
          styles.checkbox,
          { borderColor: item.checked ? colors.accent : colors.border },
          item.checked && { backgroundColor: colors.accent },
        ]}>
          {item.checked && <Ionicons name="checkmark" size={14} color="#fff" />}
        </View>
      </TouchableOpacity>
      <View style={styles.content}>
        <Text style={[styles.name, { color: colors.text, textDecorationLine: item.checked ? 'line-through' : 'none', opacity: item.checked ? 0.5 : 1 }]}>
          {item.name}
        </Text>
        {item.quantity && (
          <Text style={[styles.qty, { color: colors.textMuted }]}>{item.quantity}</Text>
        )}
      </View>
      <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="close" size={18} color={colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  checkArea: { marginRight: 14 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, gap: 2 },
  name: { fontSize: 15 },
  qty: { fontSize: 12 },
});
