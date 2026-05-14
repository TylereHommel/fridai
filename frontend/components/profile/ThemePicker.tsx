import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { THEME_COLORS, ThemeName } from '../../constants/colors';
import { useTheme } from '../../hooks/useTheme';

type Props = {
  current: ThemeName;
  onSelect: (name: ThemeName) => void;
};

export function ThemePicker({ current, onSelect }: Props) {
  const { colors } = useTheme();

  return (
    <View style={styles.grid}>
      {(Object.entries(THEME_COLORS) as [ThemeName, typeof THEME_COLORS[ThemeName]][]).map(([name, theme]) => {
        const isActive = name === current;
        return (
          <TouchableOpacity
            key={name}
            onPress={() => onSelect(name)}
            style={[
              styles.swatch,
              { borderColor: isActive ? theme.accent : colors.border, borderWidth: isActive ? 3 : 1 },
            ]}
          >
            <View style={[styles.dot, { backgroundColor: theme.accent }]} />
            <Text style={[styles.swatchLabel, { color: colors.text }]}>{theme.emoji}</Text>
            <Text style={[styles.swatchName, { color: colors.textSecondary }]}>{theme.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  swatch: { width: '30%', borderRadius: 12, padding: 12, alignItems: 'center', gap: 4 },
  dot: { width: 28, height: 28, borderRadius: 14 },
  swatchLabel: { fontSize: 16 },
  swatchName: { fontSize: 11, fontWeight: '500', textAlign: 'center' },
});
