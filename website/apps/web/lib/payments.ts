'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

/** Métodos IfthenPay (código da API). */
export type OnlineMethodCode = 'MBWAY' | 'MULTIBANCO' | 'CARD' | 'APPLE_PAY' | 'GOOGLE_PAY';
export type OnlineMethodKeys = Record<OnlineMethodCode, boolean>;

/** Métodos que o checkout pode mostrar (ligados no backoffice e, os IfthenPay, com chaves). */
export interface AvailablePaymentMethods extends OnlineMethodKeys {
  BANK_TRANSFER: boolean;
  CASH: boolean;
  mbwayAuto: boolean; // MB WAY pela IfthenPay; senão é manual
}

const NONE: AvailablePaymentMethods = {
  MBWAY: false, MULTIBANCO: false, CARD: false, APPLE_PAY: false, GOOGLE_PAY: false,
  BANK_TRANSFER: false, CASH: false, mbwayAuto: false,
};

/** Resposta do checkout com o passo seguinte do pagamento. */
export type PaymentAction =
  | { type: 'mbway'; phone: string }
  | { type: 'multibanco'; entity: string; reference: string; expiresAt: string | null }
  | { type: 'redirect'; url: string };

// Se a API falhar, ficam os métodos manuais de sempre
const FALLBACK: AvailablePaymentMethods = { ...NONE, MBWAY: true, BANK_TRANSFER: true, CASH: true };

/** null enquanto carrega. */
export function useAvailablePaymentMethods(): AvailablePaymentMethods | null {
  const [methods, setMethods] = useState<AvailablePaymentMethods | null>(null);
  useEffect(() => {
    let cancelled = false;
    api.get<AvailablePaymentMethods>('/payments/methods')
      .then((res) => { if (!cancelled) setMethods({ ...NONE, ...res.data }); })
      .catch(() => { if (!cancelled) setMethods(FALLBACK); });
    return () => { cancelled = true; };
  }, []);
  return methods;
}

/** Apple Pay só aparece em dispositivos Apple com o Safari a suportá-lo. */
export function useApplePayAvailable(): boolean {
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    try {
      const session = (window as unknown as { ApplePaySession?: { canMakePayments?: () => boolean } }).ApplePaySession;
      setAvailable(Boolean(session?.canMakePayments?.()));
    } catch {
      setAvailable(false);
    }
  }, []);
  return available;
}

/** Referência Multibanco em blocos de 3 dígitos (ex.: 123 456 789). */
export function formatMbReference(reference: string): string {
  return reference.replace(/\D/g, '').replace(/(\d{3})(?=\d)/g, '$1 ');
}
