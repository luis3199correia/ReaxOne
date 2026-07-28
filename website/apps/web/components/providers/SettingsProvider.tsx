'use client';

import { createContext, useContext } from 'react';
import type { PublicSettings } from '@/lib/settings';

const SettingsContext = createContext<PublicSettings | null>(null);

export function SettingsProvider({
  value,
  children,
}: {
  value: PublicSettings;
  children: React.ReactNode;
}) {
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): PublicSettings {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
