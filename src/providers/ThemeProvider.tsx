'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeName } from '@/types/nuba';

export const WEB_THEMES: Array<{
  id: ThemeName;
  label: string;
  tagline: string;
  swatches: [string, string, string];
}> = [
  { id: 'classic', label: 'Clásico', tagline: 'Crema luminoso, dorado cálido y coral', swatches: ['#ffffff', '#f9e4a0', '#e57a67'] },
  { id: 'cute', label: 'Cute Pastel', tagline: 'Rosa algodón, durazno y cielo pastel', swatches: ['#fff0f6', '#f472b6', '#fdba74'] },
  { id: 'minimal', label: 'Minimal', tagline: 'Galería editorial limpia', swatches: ['#f8fafc', '#1e293b', '#475569'] },
  { id: 'concert', label: 'Concert Live', tagline: 'Estadio nocturno neón dorado y rosa', swatches: ['#130a22', '#facc15', '#ec4899'] },
  { id: 'oscuro', label: 'Oscuro Neon', tagline: 'Obsidiana nocturna esmeralda y cian', swatches: ['#090d16', '#10b981', '#06b6d4'] },
];

interface ThemeContextType {
  theme: ThemeName;
  customColor: string | null;
  setTheme: (theme: ThemeName) => void;
  setCustomColor: (hex: string | null) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'classic',
  customColor: null,
  setTheme: () => {},
  setCustomColor: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>('classic');
  const [customColor, setCustomColorState] = useState<string | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem('nuba_club_theme') as ThemeName | null;
    const savedColor = window.localStorage.getItem('nuba_club_custom_color');
    const resolvedTheme = saved && WEB_THEMES.some((t) => t.id === saved) ? saved : 'classic';
    setThemeState(resolvedTheme);
    document.documentElement.setAttribute('data-theme', resolvedTheme);
    if (savedColor && /^#[0-9a-fA-F]{6}$/.test(savedColor)) {
      setCustomColorState(savedColor);
      document.documentElement.style.setProperty('--theme-secondary', savedColor);
      document.documentElement.style.setProperty('--theme-accent', savedColor);
    }
  }, []);

  const setTheme = (next: ThemeName) => {
    setThemeState(next);
    window.localStorage.setItem('nuba_club_theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  const setCustomColor = (hex: string | null) => {
    setCustomColorState(hex);
    if (hex && /^#[0-9a-fA-F]{6}$/.test(hex)) {
      window.localStorage.setItem('nuba_club_custom_color', hex);
      document.documentElement.style.setProperty('--theme-secondary', hex);
      document.documentElement.style.setProperty('--theme-accent', hex);
    } else {
      window.localStorage.removeItem('nuba_club_custom_color');
      document.documentElement.style.removeProperty('--theme-secondary');
      document.documentElement.style.removeProperty('--theme-accent');
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, customColor, setTheme, setCustomColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
