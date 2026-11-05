import { timingSafeEqual } from 'crypto';

/** Métodos pagos através da IfthenPay (confirmados automaticamente por callback). */
export const ONLINE_METHODS = ['MBWAY', 'MULTIBANCO', 'CARD', 'APPLE_PAY', 'GOOGLE_PAY'] as const;
export type OnlineMethod = (typeof ONLINE_METHODS)[number];

/** Cartão, Apple Pay e Google Pay passam pela página de pagamento da IfthenPay (Gateway). */
export const GATEWAY_METHODS: readonly OnlineMethod[] = ['CARD', 'APPLE_PAY', 'GOOGLE_PAY'];

/** Valor de "method" no URL de regresso à página de confirmação. */
export const GATEWAY_RETURN_PARAM: Record<string, string> = { CARD: 'card', APPLE_PAY: 'applepay', GOOGLE_PAY: 'googlepay' };

/** Tempo máximo para pagar antes de a encomenda ser cancelada e o stock reposto. */
export const MBWAY_TIMEOUT_MINUTES = 10;   // o pedido MB WAY expira na app ao fim de ~4 min
export const GATEWAY_TIMEOUT_MINUTES = 60;
export const DEFAULT_MB_EXPIRY_DAYS = 3;
const DAY_MS = 86_400_000;

export interface IfthenpayConfig {
  mbwayKey: string;
  mbKey: string;
  gatewayKey: string;
  cardAccount: string;     // ex.: "CCARD|ABC-123456" (fornecido pela IfthenPay)
  applePayAccount: string; // ex.: "APPLE|ABC-123456"
  googlePayAccount: string; // ex.: "GOOGLE|ABC-123456"
  antiPhishingKey: string;
  mbExpiryDays: number;
}

export function readIfthenpayConfig(env: NodeJS.ProcessEnv = process.env): IfthenpayConfig {
  const days = Number(env.IFTHENPAY_MB_EXPIRY_DAYS);
  return {
    mbwayKey:        env.IFTHENPAY_MBWAY_KEY?.trim() ?? '',
    mbKey:           env.IFTHENPAY_MB_KEY?.trim() ?? '',
    gatewayKey:      env.IFTHENPAY_GATEWAY_KEY?.trim() ?? '',
    cardAccount:     env.IFTHENPAY_CCARD_ACCOUNT?.trim() ?? '',
    applePayAccount: env.IFTHENPAY_APPLE_ACCOUNT?.trim() ?? '',
    googlePayAccount: env.IFTHENPAY_GOOGLE_ACCOUNT?.trim() ?? '',
    antiPhishingKey: env.IFTHENPAY_ANTI_PHISHING_KEY?.trim() ?? '',
    mbExpiryDays:    Number.isInteger(days) && days >= 1 && days <= 30 ? days : DEFAULT_MB_EXPIRY_DAYS,
  };
}

/** Um método só fica disponível no checkout quando as respetivas chaves estão configuradas. */
export function enabledOnlineMethods(c: IfthenpayConfig): Record<OnlineMethod, boolean> {
  const canConfirm = c.antiPhishingKey !== '';
  return {
    MBWAY:      canConfirm && c.mbwayKey !== '',
    MULTIBANCO: canConfirm && c.mbKey !== '',
    CARD:       canConfirm && c.gatewayKey !== '' && c.cardAccount !== '',
    APPLE_PAY:  canConfirm && c.gatewayKey !== '' && c.applePayAccount !== '',
    GOOGLE_PAY: canConfirm && c.gatewayKey !== '' && c.googlePayAccount !== '',
  };
}

export function isOnlineMethod(method: string): method is OnlineMethod {
  return (ONLINE_METHODS as readonly string[]).includes(method);
}

/** A IfthenPay espera valores com 2 casas decimais e ponto. */
export function formatAmount(amount: number): string {
  return amount.toFixed(2);
}

/** Compara valores em cêntimos (o callback pode trazer "12.5" ou "12,50"). */
export function amountMatches(expected: number, received: unknown): boolean {
  if (typeof received !== 'string' || received === '') return false;
  const value = Number(received.replace(',', '.'));
  return Number.isFinite(value) && Math.round(value * 100) === Math.round(expected * 100);
}

/** Telemóvel português válido para MB WAY: 9 dígitos começados por 91/92/93/96 (aceita +351). */
export function normalizeMbwayPhone(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  let digits = raw.replace(/\D+/g, '');
  if (digits.startsWith('00351')) digits = digits.slice(5);
  else if (digits.startsWith('351') && digits.length === 12) digits = digits.slice(3);
  return /^9[1236]\d{7}$/.test(digits) ? `351#${digits}` : null;
}

/** Identificador curto e único enviado à IfthenPay como orderId (máx. 15 caracteres). */
export function providerRefFor(orderId: string): string {
  return orderId.slice(-15);
}

/** Comparação em tempo constante da chave anti-phishing recebida no callback. */
export function isValidAntiPhishingKey(received: unknown, expected: string): boolean {
  if (typeof received !== 'string' || received === '' || expected === '') return false;
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Prazo a partir do qual uma encomenda por pagar é cancelada. */
export function paymentDeadline(method: OnlineMethod, createdAt: Date, mbExpiresAt: Date | null): Date {
  if (method === 'MULTIBANCO') {
    // Margem de 1 dia: um pagamento feito no último dia pode ser comunicado com atraso
    const base = mbExpiresAt ?? new Date(createdAt.getTime() + DEFAULT_MB_EXPIRY_DAYS * DAY_MS);
    return new Date(base.getTime() + DAY_MS);
  }
  const minutes = method === 'MBWAY' ? MBWAY_TIMEOUT_MINUTES : GATEWAY_TIMEOUT_MINUTES;
  return new Date(createdAt.getTime() + minutes * 60_000);
}

/** A IfthenPay devolve a validade Multibanco como "dd-mm-yyyy" (válida até ao fim do dia). */
export function parseIfthenpayDate(value: unknown): Date | null {
  if (typeof value !== 'string') return null;
  const m = /^(\d{2})-(\d{2})-(\d{4})/.exec(value.trim());
  if (!m) return null;
  const date = new Date(`${m[3]}-${m[2]}-${m[1]}T23:59:59`);
  return Number.isNaN(date.getTime()) ? null : date;
}
