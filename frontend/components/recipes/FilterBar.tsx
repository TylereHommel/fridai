import React from 'react';
import { View, ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

const CUISINE_FILTERS = ['All', 'Italian', 'Asian', 'Mexican', 'Mediterranean', 'American', 'Indian', 'Middle Eastern', 'Japanese'];
const DIETARY_FILTERS = ['All', 'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Keto', 'Low-Carb', 'Halal', 'Kosher'];

type Props = {
  activeCuisine: string;
  activeDietary: string;
  onCuisineChange: (val: string) => void;
  onDietaryChange: (val: string) => void;
};

export function FilterBar({ activeCuisine, activeDietary, onCuisineChange, onDietaryChange }: Props) {
  const { colors } = useTheme();

  function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={[
          styles.chip,
          { borderColor: active ? colors.accent : colors.border },
          active && { backgroundColor: colors.accent + '18' },
        ]}
      >
        <Text style={[styles.chipLabel, { color: active ? colors.accent : colors.textSecondary }]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, { borderBottomColor: colors.border }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {CUISINE_FILTERS.map((f) => (
          <Chip key={f} label={f} active={activeCuisine === f} onPress={() => onCuisineChange(f)} />
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {DIETARY_FILTERS.map((f) => (
          <Chip key={f} label={f} active={activeDietary === f} onPress={() => onDietaryChange(f)} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderBottomWidth: 1, paddingVertical: 8 },
  row: { paddingHorizontal: 16, gap: 8, paddingVertical: 4 },
  chip: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  chipLabel: { fontSize: 13, fontWeight: '500' },
});
