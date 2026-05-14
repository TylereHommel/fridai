import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Switch,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { Button } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';
import { ThemePicker } from '../../components/profile/ThemePicker';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { getUserDoc, updateUserDoc } from '../../lib/firestore';
import { getQuota } from '../../lib/cloudFunctions';
import { ThemeName } from '../../constants/colors';

const DIETARY_OPTIONS = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Keto', 'Halal', 'Kosher', 'Nut Allergy', 'Low-Sodium'];
const CUISINE_OPTIONS = ['Italian', 'Asian', 'Mexican', 'Mediterranean', 'American', 'Indian', 'Middle Eastern', 'Japanese'];

type QuotaInfo = { sessionCount: number; limit: number | null; subscriptionTier: 'free' | 'pro' };

export default function ProfileScreen() {
  const { colors, darkMode, accentColor, toggleDarkMode, setAccentColor } = useTheme() as any;
  const { user, signOut } = useAuth();

  const [dietary, setDietary] = useState<string[]>([]);
  const [cuisine, setCuisine] = useState<string[]>([]);
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingPrefs, setLoadingPrefs] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user?.uid]);

  async function loadData() {
    setLoadingPrefs(true);
    try {
      const [userDoc, quotaData] = await Promise.all([
        getUserDoc(user!.uid),
        getQuota().catch(() => null),
      ]);
      if (userDoc) {
        setDietary(userDoc.dietaryRestrictions ?? []);
        setCuisine(userDoc.cuisinePreferences ?? []);
      }
      if (quotaData) setQuota(quotaData as QuotaInfo);
    } finally {
      setLoadingPrefs(false);
    }
  }

  function toggleDietary(item: string) {
    setDietary((prev) => prev.includes(item) ? prev.filter((d) => d !== item) : [...prev, item]);
  }

  function toggleCuisine(item: string) {
    setCuisine((prev) => prev.includes(item) ? prev.filter((c) => c !== item) : [...prev, item]);
  }

  async function savePreferences() {
    if (!user) return;
    setSaving(true);
    try {
      await updateUserDoc(user.uid, { dietaryRestrictions: dietary, cuisinePreferences: cuisine });
      Alert.alert('Saved', 'Preferences updated.');
    } finally {
      setSaving(false);
    }
  }

  async function handleThemeChange(name: ThemeName) {
    setAccentColor(name);
    if (user) await updateUserDoc(user.uid, { themeColor: name }).catch(() => {});
  }

  async function handleDarkModeToggle() {
    toggleDarkMode();
    if (user) await updateUserDoc(user.uid, { darkMode: !darkMode }).catch(() => {});
  }

  function SectionTitle({ label }: { label: string }) {
    return <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{label}</Text>;
  }

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Account */}
        <View style={styles.avatarRow}>
          <View style={[styles.avatar, { backgroundColor: colors.accent + '20' }]}>
            <Text style={styles.avatarEmoji}>👤</Text>
          </View>
          <View>
            <Text style={[styles.name, { color: colors.text }]}>
              {user?.displayName ?? 'Fridai User'}
            </Text>
            <Text style={[styles.email, { color: colors.textSecondary }]}>{user?.email}</Text>
          </View>
        </View>

        {/* Subscription */}
        {quota && (
          <>
            <SectionTitle label="SUBSCRIPTION" />
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.row}>
                <Text style={[styles.rowLabel, { color: colors.text }]}>Plan</Text>
                <View style={[styles.badge, { backgroundColor: quota.subscriptionTier === 'pro' ? colors.accent : colors.border }]}>
                  <Text style={[styles.badgeLabel, { color: quota.subscriptionTier === 'pro' ? '#fff' : colors.textSecondary }]}>
                    {quota.subscriptionTier === 'pro' ? 'PRO' : 'FREE'}
                  </Text>
                </View>
              </View>
              <View style={styles.row}>
                <Text style={[styles.rowLabel, { color: colors.text }]}>Sessions this month</Text>
                <Text style={[styles.rowValue, { color: colors.textSecondary }]}>
                  {quota.sessionCount}{quota.limit !== null ? ` / ${quota.limit}` : ' (unlimited)'}
                </Text>
              </View>
              {quota.subscriptionTier === 'free' && quota.limit !== null && (
                <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                  <View style={[styles.progressFill, { backgroundColor: colors.accent, width: `${Math.min(100, (quota.sessionCount / quota.limit) * 100)}%` as any }]} />
                </View>
              )}
              {quota.subscriptionTier === 'free' && (
                <Button label="Upgrade to Pro — $3.99/mo" onPress={() => Alert.alert('Coming soon', 'In-app purchase powered by RevenueCat.')} style={{ marginTop: 8 }} />
              )}
            </View>
          </>
        )}

        {/* Preferences */}
        <SectionTitle label="DIETARY RESTRICTIONS" />
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {loadingPrefs ? <ActivityIndicator color={colors.accent} /> : (
            <View style={styles.chipGrid}>
              {DIETARY_OPTIONS.map((opt) => (
                <Chip
                  key={opt}
                  label={opt}
                  selected={dietary.includes(opt)}
                  onPress={() => toggleDietary(opt)}
                />
              ))}
            </View>
          )}
        </View>

        <SectionTitle label="CUISINE PREFERENCES" />
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {loadingPrefs ? <ActivityIndicator color={colors.accent} /> : (
            <View style={styles.chipGrid}>
              {CUISINE_OPTIONS.map((opt) => (
                <Chip
                  key={opt}
                  label={opt}
                  selected={cuisine.includes(opt)}
                  onPress={() => toggleCuisine(opt)}
                />
              ))}
            </View>
          )}
        </View>

        <Button label={saving ? 'Saving...' : 'Save Preferences'} onPress={savePreferences} loading={saving} style={styles.saveBtn} />

        {/* Appearance */}
        <SectionTitle label="APPEARANCE" />
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.row, styles.switchRow]}>
            <Text style={[styles.rowLabel, { color: colors.text }]}>Dark Mode</Text>
            <Switch
              value={darkMode}
              onValueChange={handleDarkModeToggle}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor="#fff"
            />
          </View>
          <Text style={[styles.subLabel, { color: colors.textMuted }]}>Color Theme</Text>
          <ThemePicker current={accentColor as ThemeName} onSelect={handleThemeChange} />
        </View>

        {/* Sign Out */}
        <Button label="Sign Out" variant="ghost" onPress={signOut} style={styles.signOut} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 100, gap: 8 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  avatar: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  avatarEmoji: { fontSize: 32 },
  name: { fontSize: 20, fontWeight: '700' },
  email: { fontSize: 13, marginTop: 2 },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 12, marginBottom: 4 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10, marginBottom: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switchRow: { paddingVertical: 4 },
  rowLabel: { fontSize: 15 },
  rowValue: { fontSize: 14 },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  badgeLabel: { fontSize: 11, fontWeight: '700' },
  progressBar: { height: 6, borderRadius: 3, overflow: 'hidden', marginTop: 4 },
  progressFill: { height: 6, borderRadius: 3 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  subLabel: { fontSize: 13, fontWeight: '600', marginTop: 4 },
  saveBtn: { marginVertical: 4 },
  signOut: { marginTop: 16 },
});
