import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { Button } from '../../components/ui/Button';
import { useTheme } from '../../hooks/useTheme';

export default function DoneScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <ScreenWrapper style={styles.wrapper}>
      <Text style={styles.celebration}>🎉</Text>
      <Text style={[styles.title, { color: colors.text }]}>You're all set!</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Scan your fridge to get started.{'\n'}Your first 15 sessions are on us.
      </Text>
      <Button
        label="Start Cooking"
        onPress={() => router.replace('/(tabs)/scanner' as any)}
        style={styles.cta}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, gap: 16 },
  celebration: { fontSize: 72 },
  title: { fontSize: 32, fontWeight: '800' },
  subtitle: { fontSize: 16, textAlign: 'center', lineHeight: 24, maxWidth: 280 },
  cta: { width: '100%', marginTop: 16 },
});
