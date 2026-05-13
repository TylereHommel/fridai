import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { Button } from '../../components/ui/Button';
import { IngredientChip } from '../../components/scanner/IngredientChip';
import { useTheme } from '../../hooks/useTheme';
import { useScanSession } from '../../hooks/useScanSession';

export default function ReviewScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { phase, detectedIngredients, confirmedIngredients, toggleIngredient, addIngredient, generateFromIngredients } = useScanSession();
  const [addText, setAddText] = useState('');

  function handleAdd() {
    if (addText.trim()) {
      addIngredient(addText.trim());
      setAddText('');
    }
  }

  async function handleGenerate() {
    await generateFromIngredients();
    router.push('/scanner/recipes-result' as any);
  }

  const isGenerating = phase === 'generating';

  return (
    <ScreenWrapper>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.back, { color: colors.textSecondary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Review Ingredients</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={[styles.sub, { color: colors.textSecondary }]}>
          Tap to remove false positives. Add anything missed.
        </Text>

        <View style={styles.legend}>
          <Text style={[styles.legendItem, { color: '#3182ce' }]}>✓ In pantry</Text>
          <Text style={[styles.legendItem, { color: colors.success }]}>✦ New item</Text>
          <Text style={[styles.legendItem, { color: colors.textMuted }]}>● Detected</Text>
        </View>

        <View style={styles.chips}>
          {detectedIngredients.map((ing) => (
            <IngredientChip
              key={ing}
              label={ing}
              status="default"
              selected={confirmedIngredients.includes(ing)}
              onToggle={() => toggleIngredient(ing)}
            />
          ))}
        </View>

        <View style={[styles.addRow, { borderColor: colors.border }]}>
          <TextInput
            placeholder="Add missing ingredient..."
            placeholderTextColor={colors.textMuted}
            value={addText}
            onChangeText={setAddText}
            onSubmitEditing={handleAdd}
            style={[styles.addInput, { color: colors.text }]}
            returnKeyType="done"
          />
          <TouchableOpacity onPress={handleAdd} style={[styles.addBtn, { backgroundColor: colors.accent }]}>
            <Text style={{ color: '#fff', fontWeight: '600' }}>+ Add</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={isGenerating ? 'Finding Recipes...' : `Find Recipes (${confirmedIngredients.length} items)`}
          onPress={handleGenerate}
          loading={isGenerating}
          disabled={confirmedIngredients.length === 0}
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  back: { fontSize: 16 },
  title: { fontSize: 17, fontWeight: '600' },
  body: { flexGrow: 1, padding: 20, paddingBottom: 100 },
  sub: { fontSize: 14, marginBottom: 12 },
  legend: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  legendItem: { fontSize: 12, fontWeight: '500' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 24 },
  addRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  addInput: { flex: 1, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15 },
  addBtn: { paddingHorizontal: 16, paddingVertical: 14 },
  footer: { padding: 20, paddingBottom: 32 },
});
