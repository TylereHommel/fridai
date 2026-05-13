import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { Button } from '../../components/ui/Button';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';

export default function ScannerTabScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();

  return (
    <ScreenWrapper style={styles.wrapper}>
      <View style={styles.top}>
        <Text style={[styles.greeting, { color: colors.textSecondary }]}>
          Hello{user?.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}
        </Text>
        <Text style={[styles.heading, { color: colors.text }]}>What's in your fridge?</Text>
      </View>

      <View style={styles.hero}>
        <View style={[styles.iconBox, { backgroundColor: colors.accent + '15' }]}>
          <Text style={styles.icon}>🧊</Text>
        </View>
        <Text style={[styles.sub, { color: colors.textSecondary }]}>
          Scan your fridge and pantry to get personalized recipe ideas based on what you already have.
        </Text>
      </View>

      <View style={styles.bottom}>
        <Button
          label="📷  Start Scanning"
          onPress={() => router.push('/scanner/capture' as any)}
          style={styles.btn}
        />
        <Text style={[styles.hint, { color: colors.textMuted }]}>
          Multi-photo • One session • AI-powered
        </Text>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  wrapper: { paddingHorizontal: 24, paddingTop: 20, justifyContent: 'space-between', paddingBottom: 32 },
  top: { gap: 4 },
  greeting: { fontSize: 14 },
  heading: { fontSize: 28, fontWeight: '800' },
  hero: { alignItems: 'center', gap: 20 },
  iconBox: { width: 120, height: 120, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 64 },
  sub: { fontSize: 15, textAlign: 'center', lineHeight: 22, maxWidth: 280 },
  bottom: { gap: 12, alignItems: 'center' },
  btn: { width: '100%' },
  hint: { fontSize: 12 },
});
