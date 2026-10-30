export interface PublicSettings {
  whatsappNumber: string;
  whatsappEnabled: boolean;
  contactEmail: string;
  iban: string;
  ibanHolder: string;
  // Portes grátis (Portugal Continental) a partir deste subtotal; 0 desativa
  freeShippingThreshold: number;
}

// Usado apenas se a API estiver indisponível
export const DEFAULT_SETTINGS: PublicSettings = {
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '351911084422',
  whatsappEnabled: true,
  contactEmail: 'contatos@reaxone.com',
  iban: process.env.NEXT_PUBLIC_BANK_IBAN || '',
  ibanHolder: '',
  freeShippingThreshold: 35,
};

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
