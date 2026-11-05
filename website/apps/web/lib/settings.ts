import type { FreeShippingThresholds } from './shippingRates';

export interface PublicSettings {
  whatsappNumber: string;
  whatsappEnabled: boolean;
  contactEmail: string;
  iban: string;
  ibanHolder: string;
  // Portes grátis a partir destes subtotais; 0 desativa
  freeShippingThreshold: number;   // Portugal Continental
  freeShippingThresholdEs: number; // Espanha (continental, Baleares e Canárias)
  freeShippingThresholdEu: number; // Restantes países da UE
  // Período dos portes grátis em ISO 8601 ('' = sem limite)
  freeShippingStartsAt: string;
  freeShippingEndsAt: string;
  // Banner no topo do site. Datas em ISO 8601 ('' = sem limite)
  bannerEnabled: boolean;
  bannerMessage: string;
  bannerSubtext: string;
  bannerMessageEn: string; // vazio → usa o texto PT
  bannerSubtextEn: string;
  bannerStartsAt: string;
  bannerEndsAt: string;
}

// Usado apenas se a API estiver indisponível
export const DEFAULT_SETTINGS: PublicSettings = {
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '351911084422',
  whatsappEnabled: true,
  contactEmail: 'contatos@reaxone.com',
  iban: process.env.NEXT_PUBLIC_BANK_IBAN || '',
  ibanHolder: '',
  freeShippingThreshold: 35,
  freeShippingThresholdEs: 50,
  freeShippingThresholdEu: 70,
  freeShippingStartsAt: '',
  freeShippingEndsAt: '',
  bannerEnabled: false,
  bannerMessage: '',
  bannerSubtext: '',
  bannerMessageEn: '',
  bannerSubtextEn: '',
  bannerStartsAt: '',
  bannerEndsAt: '',
};

export interface BannerContent {
  message: string;
  subtext: string;
}

// Banner visível se ativo, com mensagem e dentro da janela [início, fim) quando definida
export function getActiveBanner(s: PublicSettings, locale: string, now: number = Date.now()): BannerContent | null {
  if (!s.bannerEnabled || !isWithinPeriod(s.bannerStartsAt, s.bannerEndsAt, now)) return null;
  const useEn = locale === 'en' && s.bannerMessageEn.trim() !== '';
  const message = (useEn ? s.bannerMessageEn : s.bannerMessage).trim();
  if (!message) return null;
  return { message, subtext: (useEn ? s.bannerSubtextEn : s.bannerSubtext).trim() };
}

/** O instante `now` está dentro do período [início, fim)? Datas vazias = sem limite. */
export function isWithinPeriod(startsAt: string, endsAt: string, now: number = Date.now()): boolean {
  if (startsAt && now < Date.parse(startsAt)) return false;
  if (endsAt && now >= Date.parse(endsAt)) return false;
  return true;
}

/** Limites em vigor (mesma regra do servidor): fora do período ficam a 0, ou seja, sem portes grátis. */
export function getFreeShippingThresholds(s: PublicSettings, now: number = Date.now()): FreeShippingThresholds {
  const active = isWithinPeriod(s.freeShippingStartsAt, s.freeShippingEndsAt, now);
  return {
    pt: active ? s.freeShippingThreshold : 0,
    es: active ? s.freeShippingThresholdEs : 0,
    eu: active ? s.freeShippingThresholdEu : 0,
  };
}

export async function fetchPublicSettings(): Promise<PublicSettings> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  try {
    const res = await fetch(`${apiUrl}/settings/public`, { cache: 'no-store' });
    if (!res.ok) return DEFAULT_SETTINGS;
    const data = await res.json();
    return { ...DEFAULT_SETTINGS, ...data };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

// "35 €" em PT, "€35" em EN; casas decimais só quando necessárias
export function formatEuro(amount: number, locale: string): string {
  return new Intl.NumberFormat(locale === 'en' ? 'en-IE' : 'pt-PT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount);
}

export function whatsappUrl(number: string, text?: string): string {
  return text ? `https://wa.me/${number}?text=${text}` : `https://wa.me/${number}`;
}

export function formatWhatsappDisplay(number: string): string {
  return `+${number.slice(0, 3)} ${number.slice(3, 6)} ${number.slice(6, 9)} ${number.slice(9)}`;
}
