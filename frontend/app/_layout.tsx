import '../global.css';
import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuthContext } from '../contexts/AuthContext';
import { ThemeProvider, useThemeContext } from '../contexts/ThemeContext';
import { configureNotificationHandler } from '../lib/notifications';

function AuthGate() {
  const { user, loading } = useAuthContext();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inOnboarding = segments[0] === 'onboarding';
    if (!user && !inOnboarding) {
      router.replace('/onboarding' as any);
    } else if (user && inOnboarding) {
      router.replace('/(tabs)/scanner' as any);
    }
  }, [user, loading, segments]);

  return null;
}

function ThemedStatusBar() {
  const { darkMode } = useThemeContext();
  return <StatusBar style={darkMode ? 'light' : 'dark'} />;
}

export default function RootLayout() {
  useEffect(() => {
    configureNotificationHandler();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <ThemedStatusBar />
          <AuthGate />
          <Stack screenOptions={{ headerShown: false }} />
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
