import React, { createContext, useContext, useState, useCallback } from 'react';
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

export function ThemeProvider({
  children,
  initialDarkMode = false,
  initialAccent = 'forest',
  onThemeChange,
}: Props) {
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

  const setAccentColor = useCallback(
    (theme: ThemeName) => {
      setAccentColorState(theme);
      onThemeChange?.(darkMode, theme);
    },
    [darkMode, onThemeChange]
  );

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
