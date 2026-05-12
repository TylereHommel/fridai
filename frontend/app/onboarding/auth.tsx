import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as AppleAuthentication from 'expo-apple-authentication';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { Button } from '../../components/ui/Button';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';

type Mode = 'signup' | 'signin';

export default function AuthScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { signInWithApple, signInWithEmail, signUpWithEmail } = useAuth();
  const [mode, setMode] = useState<Mode>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const inputStyle = [
    styles.input,
    { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface },
  ];

  async function handleApple() {
    setLoading(true);
    try {
      await signInWithApple();
      router.replace('/onboarding/dietary' as any);
    } catch (e: any) {
      if (e.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Sign in failed', e.message ?? 'Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleEmail() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    if (mode === 'signup' && !name.trim()) {
      Alert.alert('Missing fields', 'Please enter your name.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'signup') {
        await signUpWithEmail(email.trim(), password, name.trim());
      } else {
        await signInWithEmail(email.trim(), password);
      }
      router.replace('/onboarding/dietary' as any);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.title, { color: colors.text }]}>
            {mode === 'signup' ? 'Create account' : 'Welcome back'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {mode === 'signup'
              ? 'Start cooking smarter today.'
              : 'Sign in to your Fridai account.'}
          </Text>

          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={12}
            style={styles.appleBtn}
            onPress={handleApple}
          />

          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textMuted }]}>or</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {mode === 'signup' && (
            <TextInput
              placeholder="Your name"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
              style={inputStyle}
              autoCapitalize="words"
              returnKeyType="next"
            />
          )}
          <TextInput
            placeholder="Email"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={inputStyle}
            returnKeyType="next"
          />
          <TextInput
            placeholder="Password"
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={inputStyle}
            returnKeyType="done"
            onSubmitEditing={handleEmail}
          />

          <Button
            label={mode === 'signup' ? 'Create Account' : 'Sign In'}
            onPress={handleEmail}
            loading={loading}
            style={{ marginTop: 8 }}
          />
          <Button
            label={
              mode === 'signup'
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"
            }
            variant="ghost"
            onPress={() => setMode(mode === 'signup' ? 'signin' : 'signup')}
            style={{ marginTop: 4 }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 64, paddingBottom: 40 },
  title: { fontSize: 30, fontWeight: '800', marginBottom: 6 },
  subtitle: { fontSize: 15, marginBottom: 32, lineHeight: 22 },
  appleBtn: { width: '100%', height: 52, marginBottom: 20 },
  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { marginHorizontal: 12, fontSize: 13 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, marginBottom: 12 },
});
