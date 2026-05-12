import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { Button } from '../../components/ui/Button';
import { useTheme } from '../../hooks/useTheme';

export default function WelcomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <ScreenWrapper style={styles.wrapper}>
      <View style={styles.hero}>
        <View style={[styles.logoBox, { backgroundColor: colors.accent + '18' }]}>
          <Text style={styles.logoEmoji}>🧊</Text>
        </View>
        <Text style={[styles.appName, { color: colors.text }]}>Fridai</Text>
        <Text style={[styles.tagline, { color: colors.textSecondary }]}>
          Scan your fridge.{'\n'}Get personalized recipes.{'\n'}Never waste food again.
        </Text>
      </View>

      <View style={styles.actions}>
        <Button label="Get Started" onPress={() => router.push('/onboarding/auth' as any)} />
        <Button
          label="I already have an account"
          variant="ghost"
          onPress={() => router.push('/onboarding/auth' as any)}
          style={{ marginTop: 4 }}
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  wrapper: { paddingHorizontal: 28, paddingVertical: 48, justifyContent: 'space-between' },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18 },
  logoBox: { width: 108, height: 108, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  logoEmoji: { fontSize: 58 },
  appName: { fontSize: 40, fontWeight: '800', letterSpacing: -0.5 },
  tagline: { fontSize: 18, textAlign: 'center', lineHeight: 28, maxWidth: 300 },
  actions: { gap: 8 },
});
