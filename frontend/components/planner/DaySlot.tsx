import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import type { SavedRecipe } from '../../lib/savedRecipes';

type Props = {
  day: string;
  date: string;
  recipe: SavedRecipe | null;
  isToday: boolean;
  onPress: () => void;
  onClear: () => void;
};

export function DaySlot({ day, date, recipe, isToday, onPress, onClear }: Props) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { borderColor: isToday ? colors.accent : colors.border }]}>
      <View style={styles.dateBar}>
        <Text style={[styles.day, { color: isToday ? colors.accent : colors.textSecondary }]}>{day}</Text>
        <Text style={[styles.date, { color: isToday ? colors.accent : colors.textMuted }]}>{date}</Text>
      </View>
      {recipe ? (
        <TouchableOpacity onPress={onPress} style={[styles.filled, { backgroundColor: colors.accent + '12' }]}>
          <Text style={[styles.recipeName, { color: colors.text }]} numberOfLines={2}>{recipe.title}</Text>
          <View style={styles.recipeFooter}>
            <Text style={[styles.recipeTime, { color: colors.textMuted }]}>
              ⏱ {recipe.prepTime + recipe.cookTime}m
            </Text>
            <TouchableOpacity onPress={onClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={{ color: colors.danger, fontSize: 12, fontWeight: '600' }}>✕</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={onPress} style={[styles.empty, { borderColor: colors.border }]}>
          <Text style={[styles.emptyLabel, { color: colors.textMuted }]}>+ Add meal</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: 12, borderWidth: 1.5, marginVertical: 5, marginHorizontal: 16, overflow: 'hidden' },
  dateBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8 },
  day: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  date: { fontSize: 12 },
  filled: { paddingHorizontal: 14, paddingBottom: 12, gap: 6 },
  recipeName: { fontSize: 14, fontWeight: '500', lineHeight: 19 },
  recipeFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recipeTime: { fontSize: 12 },
  empty: { borderTopWidth: 1, paddingVertical: 14, alignItems: 'center' },
  emptyLabel: { fontSize: 13 },
});
