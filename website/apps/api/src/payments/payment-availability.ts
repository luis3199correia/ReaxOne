import type { PublicSettings } from '../settings/settings.service';
import type { OnlineMethod } from './ifthenpay.rules';

export const ALL_PAYMENT_METHODS = ['MBWAY', 'MULTIBANCO', 'CARD', 'APPLE_PAY', 'GOOGLE_PAY', 'BANK_TRANSFER', 'CASH'] as const;
export type AnyPaymentMethod = (typeof ALL_PAYMENT_METHODS)[number];

/** Interruptor do backoffice que controla cada método. */
export const PAYMENT_TOGGLE: Record<AnyPaymentMethod, keyof PublicSettings> = {
  MBWAY:         'paymentMbwayEnabled',
  MULTIBANCO:    'paymentMultibancoEnabled',
  CARD:          'paymentCardEnabled',
  APPLE_PAY:     'paymentApplePayEnabled',
  GOOGLE_PAY:    'paymentGooglePayEnabled',
  BANK_TRANSFER: 'paymentTransferEnabled',
  CASH:          'paymentCashEnabled',
};

export type PaymentAvailability = Record<AnyPaymentMethod, boolean> & {
  mbwayAuto: boolean; // MB WAY pela IfthenPay (senão é manual, para o número da loja)
};

/**
 * Métodos que o checkout pode oferecer: ligados no backoffice e, nos da
 * IfthenPay, com as chaves configuradas. O MB WAY sem chaves funciona em modo manual.
 */
export function paymentAvailability(settings: PublicSettings, keysConfigured: Record<OnlineMethod, boolean>): PaymentAvailability {
  const on = (m: AnyPaymentMethod) => settings[PAYMENT_TOGGLE[m]] === true;
  return {
    MBWAY:         on('MBWAY'),
    MULTIBANCO:    on('MULTIBANCO') && keysConfigured.MULTIBANCO,
    CARD:          on('CARD') && keysConfigured.CARD,
    APPLE_PAY:     on('APPLE_PAY') && keysConfigured.APPLE_PAY,
    GOOGLE_PAY:    on('GOOGLE_PAY') && keysConfigured.GOOGLE_PAY,
    BANK_TRANSFER: on('BANK_TRANSFER'),
    CASH:          on('CASH'),
    mbwayAuto:     on('MBWAY') && keysConfigured.MBWAY,
  };
}
