import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MacroPill } from './MacroPill';
import { useTheme } from '../../hooks/useTheme';
import type { RecipeResult } from '../../lib/cloudFunctions';

const CARD_WIDTH = 220;
const CARD_HEIGHT = 300;

type Props = {
  recipe: RecipeResult;
  onPress: () => void;
};

export function RecipeCard({ recipe, onPress }: Props) {
  const { colors } = useTheme();
  const matchPct = Math.round(recipe.matchScore * 100);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.92} style={styles.card}>
      <ImageBackground
        source={recipe.imageUrl ? { uri: recipe.imageUrl } : undefined}
        style={styles.bg}
        imageStyle={styles.bgImage}
      >
        {!recipe.imageUrl && (
          <View style={[styles.placeholder, { backgroundColor: colors.surface }]}>
            <Text style={{ fontSize: 48 }}>🍽️</Text>
          </View>
        )}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.85)']}
          style={styles.gradient}
        >
          <View style={styles.footer}>
            <Text style={styles.title} numberOfLines={2}>{recipe.title}</Text>
            <View style={styles.meta}>
              <Text style={styles.time}>⏱ {recipe.prepTime + recipe.cookTime}m</Text>
              <View style={[styles.matchBadge, { backgroundColor: colors.accent }]}>
                <Text style={styles.matchText}>{matchPct}% match</Text>
              </View>
            </View>
            <View style={styles.macros}>
              <MacroPill macro="calories" value={recipe.macros.calories} />
              <MacroPill macro="protein" value={recipe.macros.protein} />
              <MacroPill macro="carbs" value={recipe.macros.carbs} />
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { width: CARD_WIDTH, height: CARD_HEIGHT, borderRadius: 16, overflow: 'hidden', marginRight: 12 },
  bg: { flex: 1 },
  bgImage: { borderRadius: 16 },
  placeholder: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  gradient: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end' },
  footer: { padding: 14, gap: 8 },
  title: { color: '#fff', fontSize: 15, fontWeight: '700', lineHeight: 20 },
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  time: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  matchBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  matchText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  macros: { flexDirection: 'row', gap: 6 },
});
