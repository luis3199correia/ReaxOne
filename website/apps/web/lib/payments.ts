'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

/** Métodos IfthenPay ativos no servidor (com as chaves configuradas). */
export interface OnlineMethods {
  MBWAY: boolean;
  MULTIBANCO: boolean;
  CARD: boolean;
  APPLE_PAY: boolean;
  GOOGLE_PAY: boolean;
}

const NONE: OnlineMethods = { MBWAY: false, MULTIBANCO: false, CARD: false, APPLE_PAY: false, GOOGLE_PAY: false };

/** Resposta do checkout com o passo seguinte do pagamento. */
export type PaymentAction =
  | { type: 'mbway'; phone: string }
  | { type: 'multibanco'; entity: string; reference: string; expiresAt: string | null }
  | { type: 'redirect'; url: string };

export function useOnlineMethods(): OnlineMethods {
  const [methods, setMethods] = useState<OnlineMethods>(NONE);
  useEffect(() => {
    let cancelled = false;
    api.get<OnlineMethods>('/payments/methods')
      .then((res) => { if (!cancelled) setMethods({ ...NONE, ...res.data }); })
      .catch(() => { /* sem métodos online: o checkout mostra só os manuais */ });
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
