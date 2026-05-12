import { getSemanticColors, THEME_COLORS, ThemeName } from '../constants/colors';

describe('THEME_COLORS', () => {
  it('has exactly 9 themes', () => {
    expect(Object.keys(THEME_COLORS)).toHaveLength(9);
  });

  it('each theme has a valid hex accent, label, and emoji', () => {
    Object.values(THEME_COLORS).forEach((theme) => {
      expect(theme.accent).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(theme.label.length).toBeGreaterThan(0);
      expect(theme.emoji.length).toBeGreaterThan(0);
    });
  });
});

describe('getSemanticColors', () => {
  it('light mode returns white background and dark text', () => {
    const c = getSemanticColors('forest', false);
    expect(c.background).toBe('#ffffff');
    expect(c.text).toBe('#111827');
  });

  it('dark mode returns near-black background and light text', () => {
    const c = getSemanticColors('forest', true);
    expect(c.background).toBe('#0f0f0f');
    expect(c.text).toBe('#f5f5f5');
  });

  it('accent matches the selected theme in both modes', () => {
    const themes = Object.keys(THEME_COLORS) as ThemeName[];
    themes.forEach((name) => {
      expect(getSemanticColors(name, false).accent).toBe(THEME_COLORS[name].accent);
      expect(getSemanticColors(name, true).accent).toBe(THEME_COLORS[name].accent);
    });
  });

  it('forest accent is #38a169', () => {
    expect(getSemanticColors('forest', false).accent).toBe('#38a169');
  });

  it('has all required semantic tokens', () => {
    const c = getSemanticColors('ocean', false);
    const required = ['background','surface','surfaceElevated','text','textSecondary','textMuted','border','accent','accentText','danger','warning','success'];
    required.forEach((key) => expect(c).toHaveProperty(key));
  });
});
