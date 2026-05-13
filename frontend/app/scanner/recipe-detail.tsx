import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { MacroPill } from '../../components/scanner/MacroPill';
import { Button } from '../../components/ui/Button';
import { useTheme } from '../../hooks/useTheme';
import { useScanSession } from '../../hooks/useScanSession';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../lib/firebase';

export default function RecipeDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { recipes } = useScanSession();
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);

  const recipe = recipes.find((r) => r.id === id);
  if (!recipe) {
    return (
      <ScreenWrapper style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: colors.text }}>Recipe not found</Text>
      </ScreenWrapper>
    );
  }

  async function handleSave() {
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', user.uid, 'savedRecipes', recipe!.id), {
        ...recipe,
        savedAt: serverTimestamp(),
        isPublic: false,
        rating: null,
        source: 'generated',
        sourceUrl: null,
      });
      setSaved(true);
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save recipe');
    }
  }

  return (
    <ScreenWrapper edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {recipe.imageUrl ? (
          <Image source={{ uri: recipe.imageUrl }} style={styles.hero} />
        ) : (
          <View style={[styles.heroPlaceholder, { backgroundColor: colors.surface }]}>
            <Text style={{ fontSize: 64 }}>🍽️</Text>
          </View>
        )}

        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text }]}>{recipe.title}</Text>

          <View style={styles.metaRow}>
            <Text style={[styles.meta, { color: colors.textSecondary }]}>⏱ {recipe.prepTime}m prep</Text>
            <Text style={[styles.meta, { color: colors.textSecondary }]}>🔥 {recipe.cookTime}m cook</Text>
            <Text style={[styles.meta, { color: colors.textSecondary }]}>🍽 {recipe.servings} servings</Text>
          </View>

          {recipe.dietaryTags.length > 0 && (
            <View style={styles.tags}>
              {recipe.dietaryTags.map((tag) => (
                <View key={tag} style={[styles.tag, { backgroundColor: colors.accent + '18' }]}>
                  <Text style={[styles.tagText, { color: colors.accent }]}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.macrosGrid}>
            {(['calories', 'protein', 'carbs', 'fat', 'fiber'] as const).map((macro) => (
              <MacroPill key={macro} macro={macro} value={recipe.macros[macro]} />
            ))}
          </View>
          <Text style={[styles.macroNote, { color: colors.textMuted }]}>
            * Estimated per serving — varies by ingredient size and brand
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Ingredients</Text>
          {recipe.ingredients.map((ing, i) => (
            <View key={i} style={[styles.ingRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.ingName, { color: colors.text }]}>{ing.name}</Text>
              <Text style={[styles.ingAmount, { color: colors.textSecondary }]}>{ing.amount}</Text>
            </View>
          ))}

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Instructions</Text>
          {recipe.steps.map((step, i) => (
            <View key={i} style={styles.step}>
              <View style={[styles.stepNumber, { backgroundColor: colors.accent }]}>
                <Text style={styles.stepNumberText}>{i + 1}</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={[styles.stepText, { color: colors.text }]}>{step.instruction}</Text>
                {step.tip && (
                  <View style={[styles.tip, { backgroundColor: colors.accent + '10' }]}>
                    <Text style={[styles.tipText, { color: colors.accent }]}>💡 {step.tip}</Text>
                  </View>
                )}
              </View>
            </View>
          ))}

          {recipe.substitutionNote && (
            <View style={[styles.subNote, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.subNoteText, { color: colors.textSecondary }]}>
                📝 {recipe.substitutionNote}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[styles.actions, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
        <Button
          label={saved ? '♡ Saved!' : '♡ Save Recipe'}
          variant={saved ? 'secondary' : 'primary'}
          onPress={handleSave}
          disabled={saved}
          style={{ flex: 1 }}
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 120 },
  hero: { width: '100%', height: 280 },
  heroPlaceholder: { width: '100%', height: 280, alignItems: 'center', justifyContent: 'center' },
  backBtn: { position: 'absolute', top: 16, left: 16, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  backBtnText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  content: { padding: 20, gap: 16 },
  title: { fontSize: 26, fontWeight: '800', lineHeight: 32 },
  metaRow: { flexDirection: 'row', gap: 16 },
  meta: { fontSize: 13 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { fontSize: 12, fontWeight: '600' },
  macrosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  macroNote: { fontSize: 11, fontStyle: 'italic' },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginTop: 8 },
  ingRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1 },
  ingName: { fontSize: 15, textTransform: 'capitalize' },
  ingAmount: { fontSize: 14 },
  step: { flexDirection: 'row', gap: 14, marginBottom: 16 },
  stepNumber: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },
  stepNumberText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  stepContent: { flex: 1, gap: 8 },
  stepText: { fontSize: 15, lineHeight: 22 },
  tip: { borderRadius: 10, padding: 12 },
  tipText: { fontSize: 13, lineHeight: 19 },
  subNote: { borderRadius: 12, borderWidth: 1, padding: 14 },
  subNoteText: { fontSize: 13, lineHeight: 19 },
  actions: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 36, borderTopWidth: 1 },
});
