import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MacroPill } from '../scanner/MacroPill';
import { useTheme } from '../../hooks/useTheme';

type Props = {
  id: string;
  title: string;
  imageUrl: string | null;
  macros: { calories: number; protein: number; carbs: number; fat: number; fiber: number };
  prepTime: number;
  cookTime: number;
  rating: number | null;
  onPress: () => void;
  onDelete?: () => void;
};

export function RecipeListCard({ id, title, imageUrl, macros, prepTime, cookTime, rating, onPress, onDelete }: Props) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.img} />
      ) : (
        <View style={[styles.imgPlaceholder, { backgroundColor: colors.border }]}>
          <Text style={{ fontSize: 28 }}>🍽️</Text>
        </View>
      )}
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>{title}</Text>
          {onDelete && (
            <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.metaRow}>
          <Text style={[styles.meta, { color: colors.textMuted }]}>⏱ {prepTime + cookTime}m</Text>
          {rating !== null && (
            <Text style={[styles.meta, { color: colors.textMuted }]}>{'★'.repeat(rating)}{'☆'.repeat(5 - rating)}</Text>
          )}
        </View>
        <View style={styles.pills}>
          <MacroPill macro="calories" value={macros.calories} />
          <MacroPill macro="protein" value={macros.protein} />
          <MacroPill macro="carbs" value={macros.carbs} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', borderRadius: 14, borderWidth: 1, overflow: 'hidden', marginHorizontal: 16, marginVertical: 6 },
  img: { width: 100, height: 100 },
  imgPlaceholder: { width: 100, height: 100, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, padding: 12, gap: 6 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  title: { flex: 1, fontSize: 14, fontWeight: '600', lineHeight: 20 },
  metaRow: { flexDirection: 'row', gap: 12 },
  meta: { fontSize: 12 },
  pills: { flexDirection: 'row', gap: 6 },
});
