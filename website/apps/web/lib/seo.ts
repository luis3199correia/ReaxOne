import type { Metadata } from 'next';
import { locales, defaultLocale, type Locale } from '@/i18n/config';
import { localizePath } from '@/i18n/routing';

export const BASE_URL = 'https://reaxone.com';

// Mapa hreflang → URL absoluto (traduzido) para uma rota interna, incluindo x-default
export function hreflangLanguages(path = ''): Record<string, string> {
  return {
    ...Object.fromEntries(locales.map((l) => [l, `${BASE_URL}${localizePath(l, path)}`])),
    'x-default': `${BASE_URL}${localizePath(defaultLocale, path)}`,
  };
}

// canonical + hreflang para uma página indexável
export function localeAlternates(locale: string, path = ''): Metadata['alternates'] {
  return {
    canonical: `${BASE_URL}${localizePath(locale as Locale, path)}`,
    languages: hreflangLanguages(path),
  };
}
