import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, TouchableOpacityProps, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

type Variant = 'primary' | 'secondary' | 'ghost';

type Props = TouchableOpacityProps & {
  label: string;
  variant?: Variant;
  loading?: boolean;
};

export function Button({ label, variant = 'primary', loading = false, disabled, style, ...rest }: Props) {
  const { colors } = useTheme();

  const variantConfig: Record<Variant, { bg: string; textColor: string; borderColor: string; borderWidth: number }> = {
    primary:   { bg: colors.accent,       textColor: colors.accentText, borderColor: 'transparent', borderWidth: 0 },
    secondary: { bg: colors.surface,      textColor: colors.text,        borderColor: colors.border,  borderWidth: 1 },
    ghost:     { bg: 'transparent',       textColor: colors.accent,      borderColor: 'transparent', borderWidth: 0 },
  };

  const v = variantConfig[variant];
  const opacity = disabled || loading ? 0.5 : 1;

  return (
    <TouchableOpacity
      disabled={disabled || loading}
      style={[
        styles.base,
        {
          backgroundColor: v.bg,
          borderWidth: v.borderWidth,
          borderColor: v.borderColor,
          opacity,
        },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={v.textColor} size="small" />
      ) : (
        <Text style={[styles.label, { color: v.textColor }]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
