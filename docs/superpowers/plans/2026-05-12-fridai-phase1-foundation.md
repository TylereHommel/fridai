# Fridai — Phase 1: Foundation + Auth

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Working Expo app with 5-tab navigation shell, Forest/dark theme system, Firebase Auth (Apple + email/password), and complete onboarding flow (welcome → auth → dietary prefs → cuisine prefs → main app).

**Architecture:** Expo Router v4 file-based routing. `app/_layout.tsx` guards auth state — unauthenticated users are redirected to `/onboarding`, authenticated users to `/(tabs)/scanner`. `ThemeContext` persists dark mode + accent color to Firestore. `AuthContext` wraps Firebase Auth state.

**Tech Stack:** Expo SDK 55, Expo Router v4, NativeWind v4, Firebase JS SDK v10 (modular), expo-apple-authentication

---

## File Map

```
app/
  _layout.tsx               — root Stack, providers, auth gate
  (tabs)/
    _layout.tsx             — bottom tab navigator (5 tabs)
    scanner.tsx             — Scanner tab stub
    recipes.tsx             — Recipes tab stub
    pantry.tsx              — Pantry tab stub
    planner.tsx             — Planner tab stub
    profile.tsx             — Profile tab stub
  onboarding/
    _layout.tsx             — onboarding Stack
    index.tsx               — welcome screen
    auth.tsx                — Apple + email/password sign-in/up
    dietary.tsx             — dietary restriction multi-select
    cuisine.tsx             — cuisine preference multi-select
    done.tsx                — "You're all set" → enter main app
global.css                  — Tailwind directives
tailwind.config.js          — NativeWind config
babel.config.js             — NativeWind babel preset
metro.config.js             — NativeWind metro config
app.json                    — Expo config (Fridai, iOS bundle ID, plugins)
.env.example                — Firebase env var template
lib/
  firebase.ts               — Firebase app init, exports db/auth/storage
  firestore.ts              — createUserDoc, getUserDoc, updateUserDoc
contexts/
  AuthContext.tsx           — user state, signInWithApple, signInWithEmail, signOut
  ThemeContext.tsx          — darkMode, accentColor, toggle/set methods
constants/
  colors.ts                 — 9 theme presets + semantic token builders
hooks/
  useAuth.ts                — convenience wrapper for AuthContext
  useTheme.ts               — convenience wrapper for ThemeContext
components/ui/
  Button.tsx                — primary/secondary/ghost variants
  Chip.tsx                  — toggleable multi-select chip
  ScreenWrapper.tsx         — SafeAreaView + themed background
__tests__/
  colors.test.ts            — getThemeColors pure function tests
  firestore.test.ts         — createUserDoc / updateUserDoc mock tests
```

---

### Task 1: Initialize Expo Project

**Files:**
- Create: `package.json`, `app.json`, `tsconfig.json`, `babel.config.js` (via Expo init)

- [ ] **Step 1: Run create-expo-app at repo root**

```bash
cd /c/ScalpBot
npx create-expo-app@latest . --template blank-typescript
```

When prompted about overwriting existing files, accept all. Expected: creates `app/`, `components/`, `constants/`, `hooks/`, `assets/`, `package.json`, `tsconfig.json`, `babel.config.js`, `app.json`.

- [ ] **Step 2: Verify project boots**

```bash
cd /c/ScalpBot
npx expo start --no-dev-client 2>&1 | head -20
```

Expected: "Starting Metro Bundler" with no fatal errors. Kill with Ctrl+C.

- [ ] **Step 3: Remove Expo template boilerplate**

```bash
rm -rf app/
mkdir -p app/\(tabs\)
mkdir -p app/onboarding
```

Expected: `app/` directory empty, subdirs created.

- [ ] **Step 4: Commit**

```bash
git add package.json app.json tsconfig.json babel.config.js .gitignore assets/
git commit -m "chore: initialize Expo SDK 55 project (Fridai)"
```

---

### Task 2: Install All Dependencies

**Files:**
- Modify: `package.json` (dependencies added)

- [ ] **Step 1: Install Expo-managed deps**

```bash
npx expo install \
  nativewind \
  tailwindcss \
  react-native-safe-area-context \
  react-native-screens \
  expo-apple-authentication \
  expo-image-picker \
  expo-barcode-scanner \
  expo-notifications \
  firebase \
  react-native-reanimated \
  @expo/vector-icons
```

Expected: all packages installed, no peer dep errors.

- [ ] **Step 2: Install non-Expo deps**

```bash
npm install react-native-purchases
```

Expected: installs RevenueCat SDK.

- [ ] **Step 3: Verify package.json has all deps**

Check `package.json` dependencies includes: `nativewind`, `tailwindcss`, `firebase`, `expo-apple-authentication`, `react-native-purchases`, `react-native-reanimated`, `@expo/vector-icons`.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install Fridai dependencies"
```

---

### Task 3: Configure NativeWind + Babel + Metro

**Files:**
- Create: `tailwind.config.js`, `global.css`, `metro.config.js`
- Modify: `babel.config.js`

- [ ] **Step 1: Write tailwind.config.js**

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

- [ ] **Step 2: Write global.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 3: Write metro.config.js**

```js
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);
module.exports = withNativeWind(config, { input: "./global.css" });
```

- [ ] **Step 4: Update babel.config.js**

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
  };
};
```

- [ ] **Step 5: Add nativewind-env.d.ts for TypeScript**

Create `nativewind-env.d.ts` at root:
```ts
/// <reference types="nativewind/types" />
```

- [ ] **Step 6: Commit**

```bash
git add tailwind.config.js global.css metro.config.js babel.config.js nativewind-env.d.ts
git commit -m "chore: configure NativeWind v4 with Tailwind"
```

---

### Task 4: Configure app.json

**Files:**
- Modify: `app.json`

- [ ] **Step 1: Rewrite app.json with Fridai config**

```json
{
  "expo": {
    "name": "Fridai",
    "slug": "fridai",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "fridai",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/images/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.fridai.app",
      "usesAppleSignIn": true,
      "infoPlist": {
        "NSCameraUsageDescription": "Fridai uses the camera to scan your fridge and pantry items.",
        "NSPhotoLibraryUsageDescription": "Fridai accesses your photos to scan fridge and pantry items.",
        "NSUserNotificationsUsageDescription": "Fridai sends expiry reminders for your pantry items."
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.fridai.app"
    },
    "web": {
      "bundler": "metro",
      "output": "static",
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": [
      "expo-router",
      "expo-apple-authentication",
      [
        "expo-image-picker",
        {
          "photosPermission": "Fridai accesses your photos to scan fridge and pantry items.",
          "cameraPermission": "Fridai uses the camera to scan your fridge and pantry items."
        }
      ],
      [
        "expo-barcode-scanner",
        {
          "cameraPermission": "Fridai uses the camera to scan barcodes for pantry items."
        }
      ],
      [
        "expo-notifications",
        {
          "icon": "./assets/images/notification-icon.png",
          "color": "#38a169",
          "defaultChannel": "default"
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

- [ ] **Step 2: Create assets directory structure**

```bash
mkdir -p assets/images assets/fonts
```

Copy or create placeholder PNGs (1x1 pixel) for required assets:
```bash
# Create minimal placeholder images (actual assets can be replaced later)
# The build won't fail with any valid PNG
cp assets/icon.png assets/images/icon.png 2>/dev/null || true
cp assets/splash.png assets/images/splash-icon.png 2>/dev/null || true
cp assets/icon.png assets/images/adaptive-icon.png 2>/dev/null || true
cp assets/icon.png assets/images/favicon.png 2>/dev/null || true
cp assets/icon.png assets/images/notification-icon.png 2>/dev/null || true
```

- [ ] **Step 3: Commit**

```bash
git add app.json assets/
git commit -m "chore: configure app.json for Fridai (iOS bundle ID, permissions, plugins)"
```

---

### Task 5: Firebase Setup

**Files:**
- Create: `lib/firebase.ts`, `.env.example`, `.env`

- [ ] **Step 1: Write .env.example**

```
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_REPLICATE_API_KEY=
EXPO_PUBLIC_REVENUECAT_IOS_KEY=
```

- [ ] **Step 2: Create lib/firebase.ts**

```ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID!,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export default app;
```

- [ ] **Step 3: Create lib/firestore.ts**

```ts
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

export type UserDoc = {
  email: string;
  displayName: string;
  dietaryRestrictions: string[];
  cuisinePreferences: string[];
  sessionCount: number;
  sessionResetDate: Date | null;
  subscriptionTier: 'free' | 'pro';
  themeColor: string;
  darkMode: boolean;
  createdAt: Date | null;
};

export async function createUserDoc(uid: string, data: Pick<UserDoc, 'email' | 'displayName'>): Promise<void> {
  const ref = doc(db, 'users', uid);
  const existing = await getDoc(ref);
  if (existing.exists()) return;

  await setDoc(ref, {
    email: data.email,
    displayName: data.displayName,
    dietaryRestrictions: [],
    cuisinePreferences: [],
    sessionCount: 0,
    sessionResetDate: null,
    subscriptionTier: 'free',
    themeColor: 'forest',
    darkMode: false,
    createdAt: serverTimestamp(),
  });
}

export async function getUserDoc(uid: string): Promise<UserDoc | null> {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as UserDoc;
}

export async function updateUserDoc(uid: string, data: Partial<UserDoc>): Promise<void> {
  const ref = doc(db, 'users', uid);
  await updateDoc(ref, data as Record<string, unknown>);
}
```

- [ ] **Step 4: Write tests for firestore.ts**

Create `__tests__/firestore.test.ts`:

```ts
import { createUserDoc, getUserDoc, updateUserDoc } from '../lib/firestore';

jest.mock('../lib/firebase', () => ({
  db: {},
}));

const mockGetDoc = jest.fn();
const mockSetDoc = jest.fn();
const mockUpdateDoc = jest.fn();
const mockDoc = jest.fn(() => 'mockRef');

jest.mock('firebase/firestore', () => ({
  doc: (...args: unknown[]) => mockDoc(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  serverTimestamp: () => 'SERVER_TIMESTAMP',
}));

describe('createUserDoc', () => {
  it('creates a new user document when none exists', async () => {
    mockGetDoc.mockResolvedValueOnce({ exists: () => false });
    mockSetDoc.mockResolvedValueOnce(undefined);

    await createUserDoc('uid123', { email: 'test@example.com', displayName: 'Test User' });

    expect(mockSetDoc).toHaveBeenCalledWith('mockRef', expect.objectContaining({
      email: 'test@example.com',
      displayName: 'Test User',
      sessionCount: 0,
      subscriptionTier: 'free',
      themeColor: 'forest',
      darkMode: false,
    }));
  });

  it('does not overwrite existing user document', async () => {
    mockGetDoc.mockResolvedValueOnce({ exists: () => true });

    await createUserDoc('uid123', { email: 'test@example.com', displayName: 'Test' });

    expect(mockSetDoc).not.toHaveBeenCalled();
  });
});

describe('updateUserDoc', () => {
  it('calls updateDoc with partial data', async () => {
    mockUpdateDoc.mockResolvedValueOnce(undefined);

    await updateUserDoc('uid123', { darkMode: true });

    expect(mockUpdateDoc).toHaveBeenCalledWith('mockRef', { darkMode: true });
  });
});
```

- [ ] **Step 5: Run tests**

```bash
npx jest __tests__/firestore.test.ts --no-coverage
```

Expected: 3 tests pass.

- [ ] **Step 6: Commit**

```bash
git add lib/ __tests__/firestore.test.ts .env.example
git commit -m "feat: Firebase init + Firestore user document helpers"
```

---

### Task 6: Color Constants + Theme System

**Files:**
- Create: `constants/colors.ts`

- [ ] **Step 1: Write constants/colors.ts**

```ts
export type ThemeName =
  | 'forest' | 'ocean' | 'sunset' | 'berry'
  | 'blossom' | 'slate' | 'crimson' | 'gold' | 'teal';

export const THEME_COLORS: Record<ThemeName, { accent: string; label: string; emoji: string }> = {
  forest:  { accent: '#38a169', label: 'Forest',  emoji: '🌿' },
  ocean:   { accent: '#3182ce', label: 'Ocean',   emoji: '🌊' },
  sunset:  { accent: '#dd6b20', label: 'Sunset',  emoji: '🌅' },
  berry:   { accent: '#805ad5', label: 'Berry',   emoji: '🫐' },
  blossom: { accent: '#d53f8c', label: 'Blossom', emoji: '🌸' },
  slate:   { accent: '#4a5568', label: 'Slate',   emoji: '🖤' },
  crimson: { accent: '#c53030', label: 'Crimson', emoji: '🔥' },
  gold:    { accent: '#b7791f', label: 'Gold',    emoji: '✨' },
  teal:    { accent: '#2c7a7b', label: 'Teal',    emoji: '🩵' },
};

export type SemanticColors = {
  background: string;
  surface: string;
  surfaceElevated: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  accent: string;
  accentText: string;
  danger: string;
  warning: string;
  success: string;
};

export function getSemanticColors(themeName: ThemeName, dark: boolean): SemanticColors {
  const accent = THEME_COLORS[themeName].accent;
  if (dark) {
    return {
      background: '#0f0f0f',
      surface: '#1a1a1a',
      surfaceElevated: '#262626',
      text: '#f5f5f5',
      textSecondary: '#a3a3a3',
      textMuted: '#525252',
      border: '#2a2a2a',
      accent,
      accentText: '#ffffff',
      danger: '#fc8181',
      warning: '#f6ad55',
      success: '#68d391',
    };
  }
  return {
    background: '#ffffff',
    surface: '#f9fafb',
    surfaceElevated: '#ffffff',
    text: '#111827',
    textSecondary: '#6b7280',
    textMuted: '#9ca3af',
    border: '#e5e7eb',
    accent,
    accentText: '#ffffff',
    danger: '#e53e3e',
    warning: '#dd6b20',
    success: '#38a169',
  };
}
```

- [ ] **Step 2: Write tests for colors.ts**

Create `__tests__/colors.test.ts`:

```ts
import { getSemanticColors, THEME_COLORS } from '../constants/colors';

describe('getSemanticColors', () => {
  it('returns forest accent in light mode', () => {
    const colors = getSemanticColors('forest', false);
    expect(colors.accent).toBe('#38a169');
    expect(colors.background).toBe('#ffffff');
    expect(colors.text).toBe('#111827');
  });

  it('returns forest accent in dark mode with dark background', () => {
    const colors = getSemanticColors('forest', true);
    expect(colors.accent).toBe('#38a169');
    expect(colors.background).toBe('#0f0f0f');
    expect(colors.text).toBe('#f5f5f5');
  });

  it('returns correct accent for each theme', () => {
    Object.entries(THEME_COLORS).forEach(([name, config]) => {
      const colors = getSemanticColors(name as keyof typeof THEME_COLORS, false);
      expect(colors.accent).toBe(config.accent);
    });
  });
});

describe('THEME_COLORS', () => {
  it('has 9 themes', () => {
    expect(Object.keys(THEME_COLORS)).toHaveLength(9);
  });

  it('each theme has accent, label, and emoji', () => {
    Object.values(THEME_COLORS).forEach((theme) => {
      expect(theme.accent).toMatch(/^#[0-9a-f]{6}$/i);
      expect(theme.label).toBeTruthy();
      expect(theme.emoji).toBeTruthy();
    });
  });
});
```

- [ ] **Step 3: Run tests**

```bash
npx jest __tests__/colors.test.ts --no-coverage
```

Expected: 5 tests pass.

- [ ] **Step 4: Commit**

```bash
git add constants/colors.ts __tests__/colors.test.ts
git commit -m "feat: theme color constants and semantic color tokens"
```

---

### Task 7: ThemeContext

**Files:**
- Create: `contexts/ThemeContext.tsx`, `hooks/useTheme.ts`

- [ ] **Step 1: Write contexts/ThemeContext.tsx**

```tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ThemeName, getSemanticColors, SemanticColors } from '../constants/colors';

type ThemeContextType = {
  darkMode: boolean;
  accentColor: ThemeName;
  colors: SemanticColors;
  toggleDarkMode: () => void;
  setAccentColor: (theme: ThemeName) => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

type Props = {
  children: React.ReactNode;
  initialDarkMode?: boolean;
  initialAccent?: ThemeName;
  onThemeChange?: (darkMode: boolean, accent: ThemeName) => void;
};

export function ThemeProvider({ children, initialDarkMode = false, initialAccent = 'forest', onThemeChange }: Props) {
  const [darkMode, setDarkMode] = useState(initialDarkMode);
  const [accentColor, setAccentColorState] = useState<ThemeName>(initialAccent);

  const colors = getSemanticColors(accentColor, darkMode);

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => {
      const next = !prev;
      onThemeChange?.(next, accentColor);
      return next;
    });
  }, [accentColor, onThemeChange]);

  const setAccentColor = useCallback((theme: ThemeName) => {
    setAccentColorState(theme);
    onThemeChange?.(darkMode, theme);
  }, [darkMode, onThemeChange]);

  return (
    <ThemeContext.Provider value={{ darkMode, accentColor, colors, toggleDarkMode, setAccentColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext(): ThemeContextType {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeContext must be used within ThemeProvider');
  return ctx;
}
```

- [ ] **Step 2: Write hooks/useTheme.ts**

```ts
export { useThemeContext as useTheme } from '../contexts/ThemeContext';
```

- [ ] **Step 3: Commit**

```bash
git add contexts/ThemeContext.tsx hooks/useTheme.ts
git commit -m "feat: ThemeContext with dark mode and 9-color accent system"
```

---

### Task 8: AuthContext

**Files:**
- Create: `contexts/AuthContext.tsx`, `hooks/useAuth.ts`

- [ ] **Step 1: Write contexts/AuthContext.tsx**

```tsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  OAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import * as AppleAuthentication from 'expo-apple-authentication';
import { auth } from '../lib/firebase';
import { createUserDoc } from '../lib/firestore';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signInWithApple: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const signInWithApple = useCallback(async () => {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    const provider = new OAuthProvider('apple.com');
    const oauthCredential = provider.credential({
      idToken: credential.identityToken!,
      rawNonce: undefined,
    });
    const result = await signInWithCredential(auth, oauthCredential);
    const displayName =
      credential.fullName?.givenName
        ? `${credential.fullName.givenName} ${credential.fullName.familyName ?? ''}`.trim()
        : result.user.displayName ?? 'Fridai User';
    await createUserDoc(result.user.uid, {
      email: result.user.email ?? '',
      displayName,
    });
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string, name: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await createUserDoc(result.user.uid, { email, displayName: name });
  }, []);

  const signOut = useCallback(async () => {
    await fbSignOut(auth);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signInWithApple, signInWithEmail, signUpWithEmail, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
}
```

- [ ] **Step 2: Write hooks/useAuth.ts**

```ts
export { useAuthContext as useAuth } from '../contexts/AuthContext';
```

- [ ] **Step 3: Commit**

```bash
git add contexts/AuthContext.tsx hooks/useAuth.ts
git commit -m "feat: AuthContext with Apple Sign-In and email/password auth"
```

---

### Task 9: Shared UI Components

**Files:**
- Create: `components/ui/Button.tsx`, `components/ui/Chip.tsx`, `components/ui/ScreenWrapper.tsx`

- [ ] **Step 1: Write components/ui/Button.tsx**

```tsx
import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, TouchableOpacityProps } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

type Variant = 'primary' | 'secondary' | 'ghost';

type Props = TouchableOpacityProps & {
  label: string;
  variant?: Variant;
  loading?: boolean;
};

export function Button({ label, variant = 'primary', loading = false, disabled, style, ...rest }: Props) {
  const { colors } = useTheme();

  const base = 'rounded-xl px-6 py-4 items-center justify-center flex-row';
  const variantStyles: Record<Variant, { bg: string; textColor: string; borderColor?: string }> = {
    primary: { bg: colors.accent, textColor: colors.accentText },
    secondary: { bg: colors.surface, textColor: colors.text, borderColor: colors.border },
    ghost: { bg: 'transparent', textColor: colors.accent },
  };

  const v = variantStyles[variant];
  const opacity = disabled || loading ? 0.5 : 1;

  return (
    <TouchableOpacity
      disabled={disabled || loading}
      style={[
        {
          backgroundColor: v.bg,
          borderWidth: variant === 'secondary' ? 1 : 0,
          borderColor: v.borderColor,
          borderRadius: 12,
          paddingHorizontal: 24,
          paddingVertical: 16,
          alignItems: 'center',
          justifyContent: 'center',
          opacity,
        },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={v.textColor} size="small" />
      ) : (
        <Text style={{ color: v.textColor, fontSize: 16, fontWeight: '600' }}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}
```

- [ ] **Step 2: Write components/ui/Chip.tsx**

```tsx
import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export function Chip({ label, selected, onPress }: Props) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: selected ? colors.accent : colors.border,
        backgroundColor: selected ? colors.accent + '20' : colors.surface,
        margin: 4,
      }}
    >
      <Text
        style={{
          fontSize: 14,
          fontWeight: selected ? '600' : '400',
          color: selected ? colors.accent : colors.textSecondary,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
```

- [ ] **Step 3: Write components/ui/ScreenWrapper.tsx**

```tsx
import React from 'react';
import { View, ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';

type Props = ViewProps & {
  children: React.ReactNode;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
};

export function ScreenWrapper({ children, edges = ['top', 'bottom'], style, ...rest }: Props) {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={edges}>
      <View style={[{ flex: 1, backgroundColor: colors.background }, style]} {...rest}>
        {children}
      </View>
    </SafeAreaView>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add components/ui/
git commit -m "feat: Button, Chip, and ScreenWrapper shared UI components"
```

---

### Task 10: Root Layout + Auth Gate

**Files:**
- Create: `app/_layout.tsx`

- [ ] **Step 1: Write app/_layout.tsx**

```tsx
import '../global.css';
import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuthContext } from '../contexts/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../hooks/useTheme';

function AuthGate() {
  const { user, loading } = useAuthContext();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inOnboarding = segments[0] === 'onboarding';
    if (!user && !inOnboarding) {
      router.replace('/onboarding');
    } else if (user && inOnboarding) {
      router.replace('/(tabs)/scanner');
    }
  }, [user, loading, segments]);

  return null;
}

function ThemeStatusBar() {
  const { darkMode } = useTheme();
  return <StatusBar style={darkMode ? 'light' : 'dark'} />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <ThemeStatusBar />
          <AuthGate />
          <Stack screenOptions={{ headerShown: false }} />
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat: root layout with AuthGate and provider tree"
```

---

### Task 11: Tab Navigator

**Files:**
- Create: `app/(tabs)/_layout.tsx`

- [ ] **Step 1: Write app/(tabs)/_layout.tsx**

```tsx
import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({ name, focused, color }: { name: IconName; focused: boolean; color: string }) {
  return <Ionicons name={focused ? name : (`${name}-outline` as IconName)} size={24} color={color} />;
}

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
      }}
    >
      <Tabs.Screen
        name="scanner"
        options={{
          title: 'Scan',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="scan" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          title: 'Recipes',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="restaurant" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="pantry"
        options={{
          title: 'Pantry',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="basket" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="planner"
        options={{
          title: 'Planner',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="calendar" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="person" focused={focused} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(tabs)/_layout.tsx"
git commit -m "feat: 5-tab bottom navigator with themed icons and labels"
```

---

### Task 12: Tab Screen Stubs

**Files:**
- Create: `app/(tabs)/scanner.tsx`, `recipes.tsx`, `pantry.tsx`, `planner.tsx`, `profile.tsx`

- [ ] **Step 1: Write scanner.tsx**

```tsx
import React from 'react';
import { Text } from 'react-native';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { useTheme } from '../../hooks/useTheme';

export default function ScannerScreen() {
  const { colors } = useTheme();
  return (
    <ScreenWrapper style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: colors.text, fontSize: 20, fontWeight: '700' }}>Scan</Text>
      <Text style={{ color: colors.textSecondary, marginTop: 8 }}>
        Fridge scanner coming soon
      </Text>
    </ScreenWrapper>
  );
}
```

- [ ] **Step 2: Write recipes.tsx**

```tsx
import React from 'react';
import { Text } from 'react-native';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { useTheme } from '../../hooks/useTheme';

export default function RecipesScreen() {
  const { colors } = useTheme();
  return (
    <ScreenWrapper style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: colors.text, fontSize: 20, fontWeight: '700' }}>Recipes</Text>
      <Text style={{ color: colors.textSecondary, marginTop: 8 }}>
        Your recipes will appear here
      </Text>
    </ScreenWrapper>
  );
}
```

- [ ] **Step 3: Write pantry.tsx**

```tsx
import React from 'react';
import { Text } from 'react-native';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { useTheme } from '../../hooks/useTheme';

export default function PantryScreen() {
  const { colors } = useTheme();
  return (
    <ScreenWrapper style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: colors.text, fontSize: 20, fontWeight: '700' }}>Pantry</Text>
      <Text style={{ color: colors.textSecondary, marginTop: 8 }}>
        Your pantry items will appear here
      </Text>
    </ScreenWrapper>
  );
}
```

- [ ] **Step 4: Write planner.tsx**

```tsx
import React from 'react';
import { Text } from 'react-native';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { useTheme } from '../../hooks/useTheme';

export default function PlannerScreen() {
  const { colors } = useTheme();
  return (
    <ScreenWrapper style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: colors.text, fontSize: 20, fontWeight: '700' }}>Planner</Text>
      <Text style={{ color: colors.textSecondary, marginTop: 8 }}>
        Your weekly meal plan will appear here
      </Text>
    </ScreenWrapper>
  );
}
```

- [ ] **Step 5: Write profile.tsx**

```tsx
import React from 'react';
import { Text } from 'react-native';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { user, signOut } = useAuth();
  return (
    <ScreenWrapper style={{ alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <Text style={{ color: colors.text, fontSize: 20, fontWeight: '700' }}>Profile</Text>
      <Text style={{ color: colors.textSecondary }}>{user?.email ?? 'Signed in'}</Text>
      <Button label="Sign Out" variant="secondary" onPress={signOut} style={{ width: 200 }} />
    </ScreenWrapper>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add "app/(tabs)/"
git commit -m "feat: 5 tab screen stubs (scanner, recipes, pantry, planner, profile)"
```

---

### Task 13: Onboarding Screens

**Files:**
- Create: `app/onboarding/_layout.tsx`, `index.tsx`, `auth.tsx`, `dietary.tsx`, `cuisine.tsx`, `done.tsx`

- [ ] **Step 1: Write app/onboarding/_layout.tsx**

```tsx
import React from 'react';
import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />;
}
```

- [ ] **Step 2: Write app/onboarding/index.tsx (Welcome)**

```tsx
import React from 'react';
import { View, Text, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { Button } from '../../components/ui/Button';
import { useTheme } from '../../hooks/useTheme';

export default function WelcomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <ScreenWrapper style={{ paddingHorizontal: 28, justifyContent: 'space-between', paddingVertical: 48 }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <View
          style={{
            width: 100,
            height: 100,
            borderRadius: 28,
            backgroundColor: colors.accent + '20',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 52 }}>🧊</Text>
        </View>
        <Text style={{ fontSize: 36, fontWeight: '800', color: colors.text, textAlign: 'center' }}>
          Fridai
        </Text>
        <Text
          style={{
            fontSize: 17,
            color: colors.textSecondary,
            textAlign: 'center',
            lineHeight: 26,
            maxWidth: 300,
          }}
        >
          Scan your fridge. Get personalized recipes. Never waste food again.
        </Text>
      </View>
      <View style={{ gap: 12 }}>
        <Button label="Get Started" onPress={() => router.push('/onboarding/auth')} />
        <Button
          label="I already have an account"
          variant="ghost"
          onPress={() => router.push('/onboarding/auth')}
        />
      </View>
    </ScreenWrapper>
  );
}
```

- [ ] **Step 3: Write app/onboarding/auth.tsx**

```tsx
import React, { useState } from 'react';
import { View, Text, TextInput, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { Button } from '../../components/ui/Button';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import * as AppleAuthentication from 'expo-apple-authentication';

export default function AuthScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { signInWithApple, signInWithEmail, signUpWithEmail } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const inputStyle = {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
    marginBottom: 12,
  };

  async function handleApple() {
    setLoading(true);
    try {
      await signInWithApple();
      router.replace('/onboarding/dietary');
    } catch (e: any) {
      if (e.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Sign in failed', e.message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleEmail() {
    if (!email || !password) return;
    if (mode === 'signup' && !name) return;
    setLoading(true);
    try {
      if (mode === 'signup') {
        await signUpWithEmail(email, password, name);
      } else {
        await signInWithEmail(email, password);
      }
      router.replace('/onboarding/dietary');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 28, paddingTop: 60, paddingBottom: 40 }}>
          <Text style={{ fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 8 }}>
            {mode === 'signup' ? 'Create account' : 'Welcome back'}
          </Text>
          <Text style={{ color: colors.textSecondary, marginBottom: 32, fontSize: 15 }}>
            {mode === 'signup' ? 'Start cooking smarter today.' : 'Sign in to your Fridai account.'}
          </Text>

          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={12}
            style={{ width: '100%', height: 52, marginBottom: 20 }}
            onPress={handleApple}
          />

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
            <Text style={{ color: colors.textMuted, marginHorizontal: 12, fontSize: 13 }}>or</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
          </View>

          {mode === 'signup' && (
            <TextInput
              placeholder="Your name"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
              style={inputStyle}
              autoCapitalize="words"
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
          />
          <TextInput
            placeholder="Password"
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={inputStyle}
          />

          <Button label={mode === 'signup' ? 'Create Account' : 'Sign In'} onPress={handleEmail} loading={loading} style={{ marginTop: 8 }} />

          <Button
            label={mode === 'signup' ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            variant="ghost"
            onPress={() => setMode(mode === 'signup' ? 'signin' : 'signup')}
            style={{ marginTop: 12 }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}
```

- [ ] **Step 4: Write app/onboarding/dietary.tsx**

```tsx
import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { Button } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { updateUserDoc } from '../../lib/firestore';

const DIETARY_OPTIONS = [
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
      if (user) {
        await updateUserDoc(user.uid, { dietaryRestrictions: selected });
      }
      router.push('/onboarding/cuisine');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 28, paddingTop: 60, paddingBottom: 40 }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 8 }}>
          Any dietary restrictions?
        </Text>
        <Text style={{ color: colors.textSecondary, marginBottom: 32, fontSize: 15 }}>
          We'll only suggest recipes that work for you. Skip if none apply.
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 40 }}>
          {DIETARY_OPTIONS.map((opt) => (
            <Chip
              key={opt}
              label={opt}
              selected={selected.includes(opt)}
              onPress={() => toggle(opt)}
            />
          ))}
        </View>
        <Button label="Continue" onPress={handleNext} loading={loading} />
        <Button
          label="Skip"
          variant="ghost"
          onPress={() => router.push('/onboarding/cuisine')}
          style={{ marginTop: 12 }}
        />
      </ScrollView>
    </ScreenWrapper>
  );
}
```

- [ ] **Step 5: Write app/onboarding/cuisine.tsx**

```tsx
import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { Button } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { updateUserDoc } from '../../lib/firestore';

const CUISINE_OPTIONS = [
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
      if (user) {
        await updateUserDoc(user.uid, { cuisinePreferences: selected });
      }
      router.push('/onboarding/done');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 28, paddingTop: 60, paddingBottom: 40 }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 8 }}>
          Favorite cuisines?
        </Text>
        <Text style={{ color: colors.textSecondary, marginBottom: 32, fontSize: 15 }}>
          We'll prioritize recipes you'll actually want to cook. Pick as many as you like.
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 40 }}>
          {CUISINE_OPTIONS.map((opt) => (
            <Chip
              key={opt}
              label={opt}
              selected={selected.includes(opt)}
              onPress={() => toggle(opt)}
            />
          ))}
        </View>
        <Button label="Continue" onPress={handleNext} loading={loading} />
        <Button
          label="Skip"
          variant="ghost"
          onPress={() => router.push('/onboarding/done')}
          style={{ marginTop: 12 }}
        />
      </ScrollView>
    </ScreenWrapper>
  );
}
```

- [ ] **Step 6: Write app/onboarding/done.tsx**

```tsx
import React from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { Button } from '../../components/ui/Button';
import { useTheme } from '../../hooks/useTheme';

export default function DoneScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <ScreenWrapper style={{ paddingHorizontal: 28, alignItems: 'center', justifyContent: 'center', gap: 20 }}>
      <Text style={{ fontSize: 64 }}>🎉</Text>
      <Text style={{ fontSize: 30, fontWeight: '800', color: colors.text, textAlign: 'center' }}>
        You're all set!
      </Text>
      <Text style={{ color: colors.textSecondary, textAlign: 'center', fontSize: 16, lineHeight: 24, maxWidth: 280 }}>
        Scan your fridge to get started. Your first 15 sessions are on us.
      </Text>
      <Button
        label="Start Cooking"
        onPress={() => router.replace('/(tabs)/scanner')}
        style={{ width: '100%', marginTop: 16 }}
      />
    </ScreenWrapper>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add app/onboarding/
git commit -m "feat: onboarding flow (welcome, auth, dietary, cuisine, done)"
```

---

### Task 14: Jest Configuration

**Files:**
- Modify: `package.json` (jest config)
- Create: `jest.config.js`

- [ ] **Step 1: Install jest and testing deps**

```bash
npm install --save-dev jest @types/jest babel-jest @testing-library/react-native jest-environment-jsdom
```

- [ ] **Step 2: Write jest.config.js**

```js
module.exports = {
  preset: 'jest-expo',
  testPathPattern: ['__tests__'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
  setupFilesAfterFramework: [],
};
```

- [ ] **Step 3: Install jest-expo**

```bash
npm install --save-dev jest-expo
```

- [ ] **Step 4: Run all tests**

```bash
npx jest --no-coverage
```

Expected: `__tests__/colors.test.ts` (5 tests) and `__tests__/firestore.test.ts` (3 tests) pass. Total: 8 tests passing.

- [ ] **Step 5: Commit**

```bash
git add jest.config.js package.json package-lock.json __tests__/
git commit -m "test: configure Jest + jest-expo, all unit tests passing"
```

---

### Task 15: Final Phase 1 Verification + Push

- [ ] **Step 1: Verify directory structure**

```bash
ls app/ app/(tabs)/ app/onboarding/ lib/ contexts/ hooks/ constants/ components/ui/
```

Expected output includes all files from the File Map at the top of this plan.

- [ ] **Step 2: Check TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors (some warnings about implicit any acceptable).

- [ ] **Step 3: Push to GitHub**

```bash
git push origin main
```

Expected: branch pushed, all commits appear on `TylereHommel/fridai`.

---

## What Phase 1 Delivers

A working app where:
- New users land on Welcome → tap Get Started → sign up with Apple or email → choose dietary/cuisine prefs → enter the main app
- Returning users auto-redirect to Scanner tab
- 5-tab navigation with theming (Forest green, light mode default)
- Sign out works from Profile tab
- All code TypeScript-strict, all utility logic tested

## Next Phases

- **Phase 2:** Scanner — multi-photo capture, Claude ingredient detection, ingredient review screen, pantry prompt
- **Phase 3:** Recipe generation — archive lookup, Claude fallback, recipe cards with Replicate images
- **Phase 4:** Pantry — CRUD, barcode scanner, expiry tracking, color coding, notifications
- **Phase 5:** Recipes tab — filter/sort, saved recipes, trending, video import
- **Phase 6:** Planner + Grocery List
- **Phase 7:** Monetization — RevenueCat, paywall, Profile settings, appearance/theme picker
- **Phase 8:** Firebase Cloud Functions (ingredient detection proxy, recipe generation, image generation, expiry cron)
