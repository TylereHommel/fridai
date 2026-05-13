import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { RecipeCard } from '../../components/scanner/RecipeCard';
import { ShimmerCard } from '../../components/scanner/ShimmerCard';
import { useTheme } from '../../hooks/useTheme';
import { useScanSession } from '../../hooks/useScanSession';
import { generateRecipeImage } from '../../lib/cloudFunctions';

export default function RecipesResultScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { recipes, phase } = useScanSession();

  useEffect(() => {
    recipes.forEach((recipe) => {
      if (recipe.imageStatus === 'pending' && !recipe.imageUrl) {
        generateRecipeImage(recipe.id, recipe.title).catch(() => {});
      }
    });
  }, [recipes]);

  return (
    <ScreenWrapper>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.back, { color: colors.textSecondary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Recipes For You</Text>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/scanner' as any)}>
          <Text style={[styles.done, { color: colors.accent }]}>Done</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {phase === 'generating' ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Generating recipes...
            </Text>
          </View>
        ) : (
          <>
            <Text style={[styles.count, { color: colors.textSecondary }]}>
              {recipes.length} recipe{recipes.length !== 1 ? 's' : ''} found
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cards} contentContainerStyle={styles.cardsContent}>
              {recipes.map((r) => (
                <RecipeCard
                  key={r.id}
                  recipe={r}
                  onPress={() => router.push({ pathname: '/scanner/recipe-detail', params: { id: r.id } } as any)}
                />
              ))}
              {phase === 'generating' && [1, 2].map((i) => <ShimmerCard key={i} />)}
            </ScrollView>
          </>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  back: { fontSize: 16 },
  title: { fontSize: 17, fontWeight: '600' },
  done: { fontSize: 16, fontWeight: '600' },
  body: { flexGrow: 1, padding: 20 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingTop: 60 },
  loadingText: { fontSize: 16 },
  count: { fontSize: 14, marginBottom: 16 },
  cards: { marginHorizontal: -20 },
  cardsContent: { paddingHorizontal: 20, gap: 12 },
});
