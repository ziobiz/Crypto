'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export const SHELL_THEMES = ['dark', 'default', 'light'] as const;
export type ShellTheme = (typeof SHELL_THEMES)[number];

const STORAGE_KEY = 'crypto-shell-theme';

type ShellThemeContextValue = {
  theme: ShellTheme;
  setTheme: (theme: ShellTheme) => void;
};

const ShellThemeContext = createContext<ShellThemeContextValue | null>(null);

function isShellTheme(v: string): v is ShellTheme {
  return (SHELL_THEMES as readonly string[]).includes(v);
}

export function ShellThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ShellTheme>('default');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && isShellTheme(stored)) setThemeState(stored);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-shell-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = (next: ShellTheme) => setThemeState(next);

  return (
    <ShellThemeContext.Provider value={{ theme, setTheme }}>{children}</ShellThemeContext.Provider>
  );
}

export function useShellTheme() {
  const ctx = useContext(ShellThemeContext);
  if (!ctx) throw new Error('useShellTheme must be used within ShellThemeProvider');
  return ctx;
}
