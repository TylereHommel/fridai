import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Alert, Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { DaySlot } from '../../components/planner/DaySlot';
import { GroceryListItem } from '../../components/planner/GroceryListItem';
import { Button } from '../../components/ui/Button';
import { useTheme } from '../../hooks/useTheme';
import { usePlanner } from '../../hooks/usePlanner';
import { useGroceryList } from '../../hooks/useGroceryList';
import { useSavedRecipes } from '../../hooks/useSavedRecipes';
import { DAY_KEYS, DayKey, getWeekId } from '../../lib/planner';
import type { SavedRecipe } from '../../lib/savedRecipes';

const DAY_LABELS: Record<DayKey, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed',
  thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
};

function getWeekDates(weekId: string): Record<DayKey, string> {
  const monday = new Date(weekId);
  return DAY_KEYS.reduce((acc, key, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    acc[key] = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return acc;
  }, {} as Record<DayKey, string>);
}

function isToday(weekId: string, dayIndex: number): boolean {
  const monday = new Date(weekId);
  const dayDate = new Date(monday);
  dayDate.setDate(monday.getDate() + dayIndex);
  const today = new Date();
  return dayDate.toDateString() === today.toDateString();
}

export default function PlannerTabScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { plan, loading: planLoading, setMeal, weekId } = usePlanner();
  const { items: groceryItems, loading: groceryLoading, add: addGrocery, toggle, remove: removeGrocery, clearChecked, checkedCount } = useGroceryList();
  const { recipes: savedRecipes } = useSavedRecipes();
  const [activeTab, setActiveTab] = useState<'planner' | 'grocery'>('planner');
  const [newItemText, setNewItemText] = useState('');

  const weekDates = getWeekDates(weekId);

  function getRecipeForDay(day: DayKey): SavedRecipe | null {
    const recipeId = plan?.[day];
    if (!recipeId) return null;
    return savedRecipes.find((r) => r.id === recipeId) ?? null;
  }

  function handleDayPress(day: DayKey) {
    router.push({ pathname: '/planner/recipe-picker', params: { day, weekId } } as any);
  }

  async function handleShare() {
    const unchecked = groceryItems.filter((i) => !i.checked);
    if (unchecked.length === 0) { Alert.alert('Empty list', 'No unchecked items to share.'); return; }
    const text = unchecked.map((i) => `• ${i.name}${i.quantity ? ` — ${i.quantity}` : ''}`).join('\n');
    await Share.share({ message: `Grocery List\n\n${text}\n\nSent from Fridai` });
  }

  async function handleAddItem() {
    if (!newItemText.trim()) return;
    await addGrocery(newItemText.trim());
    setNewItemText('');
  }

  return (
    <ScreenWrapper>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>
          {activeTab === 'planner' ? 'This Week' : 'Grocery List'}
        </Text>
        {activeTab === 'grocery' && groceryItems.length > 0 && (
          <TouchableOpacity onPress={handleShare}>
            <Text style={[styles.shareBtn, { color: colors.accent }]}>Share</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
        {(['planner', 'grocery'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tabBtn, activeTab === tab && { borderBottomColor: colors.accent }]}
          >
            <Text style={[styles.tabLabel, { color: activeTab === tab ? colors.accent : colors.textMuted }]}>
              {tab === 'planner' ? '📅  Planner' : `🛒  Grocery${groceryItems.length > 0 ? ` (${groceryItems.length})` : ''}`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'planner' ? (
        planLoading ? (
          <View style={styles.center}><ActivityIndicator color={colors.accent} /></View>
        ) : (
          <ScrollView contentContainerStyle={{ paddingTop: 8, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
            {DAY_KEYS.map((day, i) => (
              <DaySlot
                key={day}
                day={DAY_LABELS[day]}
                date={weekDates[day]}
                recipe={getRecipeForDay(day)}
                isToday={isToday(weekId, i)}
                onPress={() => handleDayPress(day)}
                onClear={() => setMeal(day, null)}
              />
            ))}
          </ScrollView>
        )
      ) : (
        <View style={{ flex: 1 }}>
          <View style={[styles.addRow, { borderBottomColor: colors.border }]}>
            <TextInput
              style={[styles.addInput, { color: colors.text }]}
              value={newItemText}
              onChangeText={setNewItemText}
              placeholder="Add item..."
              placeholderTextColor={colors.textMuted}
              onSubmitEditing={handleAddItem}
              returnKeyType="done"
            />
            <TouchableOpacity onPress={handleAddItem} style={[styles.addBtn, { backgroundColor: colors.accent }]}>
              <Text style={styles.addBtnLabel}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {groceryLoading ? (
            <View style={styles.center}><ActivityIndicator color={colors.accent} /></View>
          ) : groceryItems.length === 0 ? (
            <View style={styles.center}>
              <Text style={styles.emptyIcon}>🛒</Text>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>List is empty</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Add items manually or generate from a recipe.</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
              {groceryItems.map((item) => (
                <GroceryListItem
                  key={item.id}
                  item={item}
                  onToggle={() => toggle(item.id, !item.checked)}
                  onDelete={() => removeGrocery(item.id)}
                />
              ))}
            </ScrollView>
          )}

          {checkedCount > 0 && (
            <View style={[styles.clearBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
              <Button label={`Clear ${checkedCount} checked item${checkedCount !== 1 ? 's' : ''}`} variant="secondary" onPress={clearChecked} style={{ flex: 1 }} />
            </View>
          )}
        </View>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1 },
  title: { fontSize: 26, fontWeight: '800' },
  shareBtn: { fontSize: 16, fontWeight: '600' },
  tabs: { flexDirection: 'row', borderBottomWidth: 1 },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabLabel: { fontSize: 14, fontWeight: '600' },
  addRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  addInput: { flex: 1, fontSize: 15, paddingVertical: 8 },
  addBtn: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnLabel: { color: '#fff', fontWeight: '600', fontSize: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 10 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  clearBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, borderTopWidth: 1 },
});
