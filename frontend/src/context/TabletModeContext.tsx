'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

const TABLET_KEY = 'crypto-tablet-mode';

type TabletModeContextValue = {
  tablet: boolean;
  setTablet: (value: boolean | ((prev: boolean) => boolean)) => void;
};

const TabletModeContext = createContext<TabletModeContextValue | null>(null);

export function TabletModeProvider({ children }: { children: ReactNode }) {
  const [tablet, setTablet] = useState(false);

  useEffect(() => {
    setTablet(localStorage.getItem(TABLET_KEY) === '1');
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('tablet-mode', tablet);
    localStorage.setItem(TABLET_KEY, tablet ? '1' : '0');
  }, [tablet]);

  return (
    <TabletModeContext.Provider value={{ tablet, setTablet }}>{children}</TabletModeContext.Provider>
  );
}

export function useTabletMode() {
  const ctx = useContext(TabletModeContext);
  if (!ctx) throw new Error('useTabletMode must be used within TabletModeProvider');
  return ctx;
}
