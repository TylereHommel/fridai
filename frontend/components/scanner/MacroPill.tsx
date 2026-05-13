import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const MACRO_COLORS = {
  calories: '#e53e3e',
  protein: '#38a169',
  carbs: '#dd6b20',
  fat: '#805ad5',
  fiber: '#2c7a7b',
};

type MacroKey = keyof typeof MACRO_COLORS;

type Props = {
  macro: MacroKey;
  value: number;
  unit?: string;
};

export function MacroPill({ macro, value, unit = 'g' }: Props) {
  const color = MACRO_COLORS[macro];
  const label = macro === 'calories' ? 'Cal' : macro.charAt(0).toUpperCase() + macro.slice(1);
  const displayUnit = macro === 'calories' ? '' : unit;

  return (
    <View style={[styles.pill, { backgroundColor: color + '18', borderColor: color + '40' }]}>
      <Text style={[styles.value, { color }]}>{value}{displayUnit}</Text>
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center', minWidth: 52 },
  value: { fontSize: 14, fontWeight: '700' },
  label: { fontSize: 10, fontWeight: '500', marginTop: 1 },
});
