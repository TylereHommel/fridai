import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export function Chip({ label, selected, onPress }: Props) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.chip,
        {
          borderColor: selected ? colors.accent : colors.border,
          backgroundColor: selected ? colors.accent + '20' : colors.surface,
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          { color: selected ? colors.accent : colors.textSecondary },
          selected && styles.selectedLabel,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
    margin: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '400',
  },
  selectedLabel: {
    fontWeight: '600',
  },
});
