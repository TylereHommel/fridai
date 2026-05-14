import React, { useState } from 'react';
import { View, Text, SectionList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { PantryItemRow } from '../../components/pantry/PantryItemRow';
import { AddItemSheet } from '../../components/pantry/AddItemSheet';
import { useTheme } from '../../hooks/useTheme';
import { usePantry } from '../../hooks/usePantry';
import type { PantryItem, PantryCategory } from '../../lib/pantry';

const SECTION_META: { key: PantryCategory; label: string; icon: string }[] = [
  { key: 'fridge', label: 'Fridge', icon: '🧊' },
  { key: 'freezer', label: 'Freezer', icon: '❄️' },
  { key: 'pantry', label: 'Pantry', icon: '🗄️' },
];

export default function PantryTabScreen() {
  const { colors } = useTheme();
  const { groups, loading, add, remove } = usePantry();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editItem, setEditItem] = useState<PantryItem | null>(null);

  const sections = SECTION_META.map(({ key, label, icon }) => ({
    key,
    title: `${icon}  ${label}`,
    count: groups[key].length,
    data: groups[key],
  }));

  const totalItems = sections.reduce((s, sec) => s + sec.count, 0);

  function handleDelete(item: PantryItem) {
    Alert.alert('Remove Item', `Remove "${item.name}" from pantry?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => remove(item.id) },
    ]);
  }

  function handleEdit(item: PantryItem) {
    setEditItem(item);
    setSheetOpen(true);
  }

  function handleAddNew() {
    setEditItem(null);
    setSheetOpen(true);
  }

  return (
    <ScreenWrapper>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Pantry</Text>
          {totalItems > 0 && (
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              {totalItems} item{totalItems !== 1 ? 's' : ''}
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={handleAddNew} style={[styles.addBtn, { backgroundColor: colors.accent }]}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>⏳</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Loading pantry...</Text>
        </View>
      ) : totalItems === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>🗄️</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Your pantry is empty</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Add items manually or scan a barcode.{'\n'}Items detected during a fridge scan appear here automatically.
          </Text>
          <TouchableOpacity onPress={handleAddNew} style={[styles.emptyBtn, { backgroundColor: colors.accent }]}>
            <Text style={styles.emptyBtnLabel}>+ Add First Item</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PantryItemRow
              item={item}
              onDelete={() => handleDelete(item)}
              onPress={() => handleEdit(item)}
            />
          )}
          renderSectionHeader={({ section }) =>
            section.data.length === 0 ? null : (
              <View style={[styles.sectionHeader, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
                <View style={[styles.countBadge, { backgroundColor: colors.accent + '20' }]}>
                  <Text style={[styles.countText, { color: colors.accent }]}>{section.count}</Text>
                </View>
              </View>
            )
          }
          stickySectionHeadersEnabled
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      <AddItemSheet
        visible={sheetOpen}
        onClose={() => { setSheetOpen(false); setEditItem(null); }}
        onSave={add}
        initial={editItem ?? undefined}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14, borderBottomWidth: 1 },
  title: { fontSize: 26, fontWeight: '800' },
  subtitle: { fontSize: 12, marginTop: 2 },
  addBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 10, borderBottomWidth: 1 },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  countBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  countText: { fontSize: 12, fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { fontSize: 20, fontWeight: '700' },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  emptyBtn: { borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12, marginTop: 8 },
  emptyBtnLabel: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
