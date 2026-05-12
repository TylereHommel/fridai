import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { useTheme } from '../../hooks/useTheme';

export default function ScannerScreen() {
  const { colors } = useTheme();
  return (
    <ScreenWrapper style={styles.center}>
      <View style={[styles.iconBox, { backgroundColor: colors.accent + '15' }]}>
        <Text style={styles.icon}>🧊</Text>
      </View>
      <Text style={[styles.title, { color: colors.text }]}>Scan Your Fridge</Text>
      <Text style={[styles.sub, { color: colors.textSecondary }]}>
        Multi-photo AI scanning — coming in Phase 2
      </Text>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', gap: 16 },
  iconBox: { width: 88, height: 88, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 40 },
  title: { fontSize: 22, fontWeight: '700' },
  sub: { fontSize: 14, textAlign: 'center', maxWidth: 260, lineHeight: 20 },
});
