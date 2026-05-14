import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { useTheme } from '../../hooks/useTheme';
import { useSavedRecipes } from '../../hooks/useSavedRecipes';
import { usePlanner } from '../../hooks/usePlanner';
import type { DayKey } from '../../lib/planner';

export default function RecipePickerScreen() {
  const router = useRouter();
  const { day, weekId } = useLocalSearchParams<{ day: string; weekId: string }>();
  const { colors } = useTheme();
  const { recipes } = useSavedRecipes();
  const { setMeal } = usePlanner(weekId);

  async function handleSelect(recipeId: string) {
    await setMeal(day as DayKey, recipeId);
    router.back();
  }

  return (
    <ScreenWrapper>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.cancel, { color: colors.textSecondary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Pick a Recipe</Text>
        <View style={{ width: 60 }} />
      </View>

      {recipes.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 48 }}>📖</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No saved recipes</Text>
          <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
            Save recipes from a scan session first.
          </Text>
        </View>
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ paddingVertical: 8 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleSelect(item.id)}
              style={[styles.row, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}
              activeOpacity={0.7}
            >
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.img} />
              ) : (
                <View style={[styles.imgPlaceholder, { backgroundColor: colors.border }]}>
                  <Text style={{ fontSize: 24 }}>🍽️</Text>
                </View>
              )}
              <View style={styles.info}>
                <Text style={[styles.recipeName, { color: colors.text }]} numberOfLines={2}>{item.title}</Text>
                <Text style={[styles.recipeMeta, { color: colors.textMuted }]}>
                  ⏱ {item.prepTime + item.cookTime}m · {item.macros.calories} cal
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  cancel: { fontSize: 16 },
  title: { fontSize: 17, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  img: { width: 64, height: 64, borderRadius: 10, marginRight: 14 },
  imgPlaceholder: { width: 64, height: 64, borderRadius: 10, marginRight: 14, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, gap: 4 },
  recipeName: { fontSize: 15, fontWeight: '500', lineHeight: 20 },
  recipeMeta: { fontSize: 12 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptySub: { fontSize: 14, textAlign: 'center' },
});
