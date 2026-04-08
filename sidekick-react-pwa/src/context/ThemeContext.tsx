import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { getUserSettings } from '../services/database/settings';
import { useAuth } from './AuthContext';

export type ThemePreference = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  themePreference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setThemePreference: (theme: ThemePreference) => void;
}

const STORAGE_KEY = 'sidekick.theme';
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getStoredTheme(): ThemePreference {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === 'light' || raw === 'dark' || raw === 'system') {
      return raw;
    }
  } catch {
    // Ignore storage failures.
  }
  return 'dark';
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return 'dark';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyThemeToDocument(theme: ResolvedTheme) {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.dataset.theme = theme;
  document.body.dataset.theme = theme;
  root.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>(() => getStoredTheme());
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() => getSystemTheme());

  const resolvedTheme = useMemo<ResolvedTheme>(() => {
    return themePreference === 'system' ? systemTheme : themePreference;
  }, [systemTheme, themePreference]);

  useEffect(() => {
    applyThemeToDocument(resolvedTheme);
  }, [resolvedTheme]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, themePreference);
    } catch {
      // Ignore storage failures.
    }
  }, [themePreference]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? 'dark' : 'light');
    };

    setSystemTheme(media.matches ? 'dark' : 'light');
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!user?.id) {
      setThemePreferenceState(getStoredTheme());
      return;
    }

    void getUserSettings(user.id).then((settings) => {
      if (cancelled) return;
      const nextTheme = settings.theme || 'dark';
      setThemePreferenceState(nextTheme);
    }).catch(() => {
      if (cancelled) return;
      setThemePreferenceState(getStoredTheme());
    });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const setThemePreference = (theme: ThemePreference) => {
    setThemePreferenceState(theme);
  };

  const value = {
    themePreference,
    resolvedTheme,
    setThemePreference,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
