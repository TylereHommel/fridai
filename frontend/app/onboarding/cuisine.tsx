import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { Button } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { updateUserDoc } from '../../lib/firestore';

const OPTIONS = [
  'Italian', 'Asian', 'Mexican', 'Mediterranean',
  'American', 'Indian', 'Middle Eastern', 'Japanese',
];

export default function CuisineScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  function toggle(item: string) {
    setSelected((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  }

  async function handleNext() {
    setLoading(true);
    try {
      if (user) await updateUserDoc(user.uid, { cuisinePreferences: selected });
      router.push('/onboarding/done' as any);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { color: colors.text }]}>Favorite cuisines?</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          We'll prioritize recipes you'll actually want to cook. Pick as many as you like.
        </Text>
        <View style={styles.chips}>
          {OPTIONS.map((opt) => (
            <Chip key={opt} label={opt} selected={selected.includes(opt)} onPress={() => toggle(opt)} />
          ))}
        </View>
        <Button label="Continue" onPress={handleNext} loading={loading} />
        <Button
          label="Skip"
          variant="ghost"
          onPress={() => router.push('/onboarding/done' as any)}
          style={{ marginTop: 8 }}
        />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 64, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 8 },
  subtitle: { fontSize: 15, marginBottom: 32, lineHeight: 22 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 36 },
});
