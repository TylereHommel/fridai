import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { FilterBar } from '../../components/recipes/FilterBar';
import { RecipeListCard } from '../../components/recipes/RecipeListCard';
import { useTheme } from '../../hooks/useTheme';
import { useSavedRecipes } from '../../hooks/useSavedRecipes';
import { fetchTrending, TrendingRecipe } from '../../lib/trending';
import { getUserDoc } from '../../lib/firestore';
import { useAuth } from '../../hooks/useAuth';
import type { SavedRecipe } from '../../lib/savedRecipes';

export default function RecipesTabScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { recipes: saved, loading: savedLoading, remove } = useSavedRecipes();
  const [trending, setTrending] = useState<TrendingRecipe[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [activeCuisine, setActiveCuisine] = useState('All');
  const [activeDietary, setActiveDietary] = useState('All');
  const [activeTab, setActiveTab] = useState<'saved' | 'trending'>('saved');

  useEffect(() => {
    loadTrending();
  }, []);

  async function loadTrending() {
    setTrendingLoading(true);
    try {
      const userDoc = user ? await getUserDoc(user.uid) : null;
      const results = await fetchTrending(userDoc?.dietaryRestrictions ?? []);
      setTrending(results);
    } catch {}
    setTrendingLoading(false);
  }

  function applyFilters<T extends { dietaryTags: string[]; title: string }>(items: T[]): T[] {
    return items.filter((r) => {
      const cuisineOk = activeCuisine === 'All' || r.dietaryTags.includes(activeCuisine) || r.title.toLowerCase().includes(activeCuisine.toLowerCase());
      const dietaryOk = activeDietary === 'All' || r.dietaryTags.some((t) => t.toLowerCase() === activeDietary.toLowerCase());
      return cuisineOk && dietaryOk;
    });
  }

  function confirmDelete(recipe: SavedRecipe) {
    Alert.alert('Remove Recipe', `Remove "${recipe.title}" from saved?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => remove(recipe.id) },
    ]);
  }

  const filteredSaved = applyFilters(saved);
  const filteredTrending = applyFilters(trending);

  const savedEmpty = !savedLoading && filteredSaved.length === 0;
  const trendingEmpty = !trendingLoading && filteredTrending.length === 0;

  return (
    <ScreenWrapper>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Recipes</Text>
      </View>

      <FilterBar
        activeCuisine={activeCuisine}
        activeDietary={activeDietary}
        onCuisineChange={setActiveCuisine}
        onDietaryChange={setActiveDietary}
      />

      <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
        {(['saved', 'trending'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tabBtn, activeTab === tab && { borderBottomColor: colors.accent }]}
          >
            <Text style={[styles.tabLabel, { color: activeTab === tab ? colors.accent : colors.textMuted }]}>
              {tab === 'saved' ? `Saved${saved.length > 0 ? ` (${saved.length})` : ''}` : 'Trending'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'saved' ? (
        savedLoading ? (
          <View style={styles.center}><ActivityIndicator color={colors.accent} /></View>
        ) : savedEmpty ? (
          <View style={styles.center}>
            <Text style={styles.emptyIcon}>📖</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No saved recipes yet</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Scan your fridge and save recipes you like.
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredSaved}
            keyExtractor={(r) => r.id}
            renderItem={({ item }) => (
              <RecipeListCard
                id={item.id}
                title={item.title}
                imageUrl={item.imageUrl}
                macros={item.macros}
                prepTime={item.prepTime}
                cookTime={item.cookTime}
                rating={item.rating}
                onPress={() => router.push({ pathname: '/recipes/detail', params: { id: item.id } } as any)}
                onDelete={() => confirmDelete(item)}
              />
            )}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )
      ) : (
        trendingLoading ? (
          <View style={styles.center}><ActivityIndicator color={colors.accent} /></View>
        ) : trendingEmpty ? (
          <View style={styles.center}>
            <Text style={styles.emptyIcon}>📈</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No trending recipes yet</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Start scanning and generating recipes — they'll appear here.
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredTrending}
            keyExtractor={(r) => r.id}
            renderItem={({ item }) => (
              <RecipeListCard
                id={item.id}
                title={item.title}
                imageUrl={item.imageUrl}
                macros={item.macros}
                prepTime={item.prepTime}
                cookTime={item.cookTime}
                rating={item.averageRating ? Math.round(item.averageRating) : null}
                onPress={() => router.push({ pathname: '/recipes/detail', params: { id: item.id, source: 'trending' } } as any)}
              />
            )}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1 },
  title: { fontSize: 26, fontWeight: '800' },
  tabs: { flexDirection: 'row', borderBottomWidth: 1 },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabLabel: { fontSize: 14, fontWeight: '600' },
  list: { paddingVertical: 8, paddingBottom: 100 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 10 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
