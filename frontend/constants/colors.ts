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
