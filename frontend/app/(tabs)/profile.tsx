import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { Button } from '../../components/ui/Button';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';

export default function ProfileScreen() {
  const { colors, darkMode, accentColor, toggleDarkMode, THEME_COLORS } = useTheme() as any;
  const { user, signOut } = useAuth();

  return (
    <ScreenWrapper style={styles.wrapper}>
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: colors.accent + '20' }]}>
          <Text style={styles.avatarEmoji}>👤</Text>
        </View>
        <Text style={[styles.name, { color: colors.text }]}>
          {user?.displayName ?? user?.email ?? 'Fridai User'}
        </Text>
        <Text style={[styles.email, { color: colors.textSecondary }]}>{user?.email}</Text>
      </View>

      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.row}>
          <Text style={[styles.rowLabel, { color: colors.text }]}>Dark Mode</Text>
          <Text style={[styles.rowValue, { color: colors.textSecondary }]}>
            {darkMode ? 'On' : 'Off'}
          </Text>
        </View>
        <Button
          label={darkMode ? '☀️  Switch to Light' : '🌙  Switch to Dark'}
          variant="secondary"
          onPress={toggleDarkMode}
          style={styles.themeBtn}
        />
      </View>

      <Button
        label="Sign Out"
        variant="ghost"
        onPress={signOut}
        style={styles.signOut}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  wrapper: { paddingHorizontal: 24, paddingTop: 32, gap: 24 },
  header: { alignItems: 'center', gap: 8, paddingBottom: 8 },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  avatarEmoji: { fontSize: 36 },
  name: { fontSize: 20, fontWeight: '700' },
  email: { fontSize: 14 },
  section: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { fontSize: 15, fontWeight: '500' },
  rowValue: { fontSize: 14 },
  themeBtn: { marginTop: 4 },
  signOut: { marginTop: 8 },
});
