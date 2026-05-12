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
  'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free',
  'Keto', 'Halal', 'Kosher', 'Nut Allergy', 'Low-Sodium',
];

export default function DietaryScreen() {
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
      if (user) await updateUserDoc(user.uid, { dietaryRestrictions: selected });
      router.push('/onboarding/cuisine' as any);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { color: colors.text }]}>Any dietary restrictions?</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          We'll only suggest recipes that work for you. Skip if none apply.
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
          onPress={() => router.push('/onboarding/cuisine' as any)}
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
