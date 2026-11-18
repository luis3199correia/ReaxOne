'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ConsentChoice, OPEN_CONSENT_EVENT, readConsent, saveConsent } from '@/lib/analytics';

const ALL: ConsentChoice = { analytics: true, ads: true };
const NONE: ConsentChoice = { analytics: false, ads: false };

/**
 * Aviso de cookies (RGPD) ligado ao Consent Mode v2 do Google.
 * "Aceitar" e "Rejeitar" têm o mesmo destaque; nada é ativado sem escolha explícita.
 */
export default function CookieConsent() {
  const t = useTranslations('cookies');
  const [open, setOpen] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [choice, setChoice] = useState<ConsentChoice>(NONE);

  useEffect(() => {
    if (!readConsent()) setOpen(true);
    function reopen() {
      setChoice(readConsent() ?? NONE);
      setCustomizing(true);
      setOpen(true);
    }
    window.addEventListener(OPEN_CONSENT_EVENT, reopen);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, reopen);
  }, []);

  function decide(next: ConsentChoice) {
    saveConsent(next);
    setOpen(false);
    setCustomizing(false);
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={t('title')}
      className="fixed inset-x-0 bottom-0 z-[60] p-4 sm:p-6 pointer-events-none"
    >
      <div className="pointer-events-auto mx-auto max-w-3xl rounded-2xl bg-white shadow-2xl border border-gray-200 p-5 sm:p-6">
        <h2 className="font-bold text-brand-dark mb-2">{t('title')}</h2>
        <p className="text-sm text-gray-600 leading-relaxed mb-4">
          {t('text')}{' '}
          <Link href="/privacidade" className="text-brand-primary underline hover:no-underline">
            {t('privacy_link')}
          </Link>
        </p>

        {customizing && (
          <div className="space-y-3 mb-5">
            <ConsentToggle label={t('necessary')} description={t('necessary_desc')} checked disabled />
            <ConsentToggle
              label={t('analytics')}
              description={t('analytics_desc')}
              checked={choice.analytics}
              onChange={(analytics) => setChoice((c) => ({ ...c, analytics }))}
            />
            <ConsentToggle
              label={t('ads')}
              description={t('ads_desc')}
              checked={choice.ads}
              onChange={(ads) => setChoice((c) => ({ ...c, ads }))}
            />
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
          {customizing ? (
            <button onClick={() => decide(choice)} className={SECONDARY}>{t('save')}</button>
          ) : (
            <button onClick={() => setCustomizing(true)} className={LINK}>{t('customize')}</button>
          )}
          <button onClick={() => decide(NONE)} className={PRIMARY}>{t('reject')}</button>
          <button onClick={() => decide(ALL)} className={PRIMARY}>{t('accept')}</button>
        </div>
      </div>
    </div>
  );
}

const PRIMARY = 'px-5 py-2.5 rounded-xl text-sm font-semibold bg-brand-dark text-white hover:bg-black transition-colors';
const SECONDARY = 'px-5 py-2.5 rounded-xl text-sm font-semibold border-2 border-brand-dark text-brand-dark hover:bg-gray-50 transition-colors';
const LINK = 'px-3 py-2.5 text-sm font-medium text-gray-600 underline hover:text-brand-dark';

function ConsentToggle({
  label, description, checked, disabled, onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (value: boolean) => void;
}) {
  return (
    <label className={`flex items-start gap-3 ${disabled ? 'opacity-70' : 'cursor-pointer'}`}>
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 accent-brand-primary"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
      />
      <span>
        <span className="block text-sm font-semibold text-brand-dark">{label}</span>
        <span className="block text-xs text-gray-500">{description}</span>
      </span>
    </label>
  );
}
