import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

const CARD_WIDTH = 200;
const CARD_HEIGHT = 280;

export function ShimmerCard() {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, [opacity]);

  return (
    <Animated.View style={[styles.card, { backgroundColor: colors.surface, opacity }]}>
      <View style={[styles.imgPlaceholder, { backgroundColor: colors.border }]} />
      <View style={[styles.line, { backgroundColor: colors.border, width: '70%' }]} />
      <View style={[styles.line, { backgroundColor: colors.border, width: '50%' }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { width: CARD_WIDTH, height: CARD_HEIGHT, borderRadius: 16, overflow: 'hidden', marginRight: 12 },
  imgPlaceholder: { width: '100%', height: 160 },
  line: { height: 14, borderRadius: 7, margin: 12, marginBottom: 6 },
});
