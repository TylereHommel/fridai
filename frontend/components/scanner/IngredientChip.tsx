import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

type Status = 'default' | 'pantry' | 'new';

type Props = {
  label: string;
  status: Status;
  selected: boolean;
  onToggle: () => void;
};

export function IngredientChip({ label, status, selected, onToggle }: Props) {
  const { colors } = useTheme();

  const statusColors: Record<Status, string> = {
    default: colors.textMuted,
    pantry: '#3182ce',
    new: colors.success,
  };

  const statusIcons: Record<Status, 'checkmark' | 'add' | undefined> = {
    default: undefined,
    pantry: 'checkmark',
    new: 'add',
  };

  const icon = statusIcons[status];
  const dotColor = statusColors[status];

  return (
    <TouchableOpacity
      onPress={onToggle}
      style={[
        styles.chip,
        {
          borderColor: selected ? colors.border : colors.border + '50',
          backgroundColor: selected ? colors.surface : colors.background,
          opacity: selected ? 1 : 0.4,
        },
      ]}
    >
      {icon && (
        <Ionicons name={icon} size={12} color={dotColor} style={{ marginRight: 4 }} />
      )}
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, margin: 4 },
  label: { fontSize: 14 },
});
