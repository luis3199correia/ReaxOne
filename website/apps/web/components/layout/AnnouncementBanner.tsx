'use client';

import { useLocale } from 'next-intl';
import { useSettings } from '@/components/providers/SettingsProvider';
import { getActiveBanner } from '@/lib/settings';

// Banner de anúncio no topo do site, configurado em Admin → Configurações
export default function AnnouncementBanner() {
  const settings = useSettings();
  const locale = useLocale();
  const banner = getActiveBanner(settings, locale);

  if (!banner) return null;

  return (
    <div role="region" aria-label={locale === 'en' ? 'Announcement' : 'Anúncio'} className="bg-brand-primary text-white text-center px-4 py-2">
      <p className="text-sm font-semibold leading-snug">{banner.message}</p>
      {banner.subtext && (
        <p className="text-xs opacity-90 leading-snug mt-0.5">{banner.subtext}</p>
      )}
    </div>
  );
}
