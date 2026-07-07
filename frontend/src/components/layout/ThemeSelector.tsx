'use client';

import { useT } from '@/context/LocaleProvider';
import { SHELL_THEMES, useShellTheme, type ShellTheme } from '@/context/ShellThemeContext';
import type { MessageKey } from '@/i18n/messages';

const THEME_LABEL: Record<ShellTheme, MessageKey> = {
  dark: 'theme.dark',
  default: 'theme.default',
  light: 'theme.light',
};

export function ThemeSelector() {
  const t = useT();
  const { theme, setTheme } = useShellTheme();

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="pg-session-meta-label">{t('theme.label')}</span>
      <span className="pg-theme-pill">
        {SHELL_THEMES.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setTheme(id)}
            className={`pg-theme-btn ${theme === id ? 'pg-theme-btn-active' : 'pg-theme-btn-idle'}`}
            aria-pressed={theme === id}
          >
            {t(THEME_LABEL[id])}
          </button>
        ))}
      </span>
    </span>
  );
}
