import type { DiscountCode } from '@prisma/client';

/** reason !== null → código não aplicável (mensagem para o cliente). */
export interface DiscountCheck {
  amount: number;
  reason: string | null;
}

const reject = (reason: string): DiscountCheck => ({ amount: 0, reason });

type DiscountRules = Pick<
  DiscountCode,
  'type' | 'value' | 'active' | 'minOrderAmount' | 'maxUses' | 'usedCount' | 'startsAt' | 'expiresAt'
>;

export function normalizeCode(code: unknown): string {
  return typeof code === 'string' ? code.trim().toUpperCase() : '';
}

function roundCents(value: number) {
  return Math.round(value * 100) / 100;
}

/**
 * Regras de um código de desconto: estado, validade, usos e compra mínima.
 * O desconto aplica-se só ao subtotal dos produtos (nunca aos portes) e
 * nunca o ultrapassa.
 */
export function evaluateDiscount(discount: DiscountRules, subtotal: number, now: Date = new Date()): DiscountCheck {
  if (!discount.active) return reject('Este código de desconto não está ativo.');
  if (discount.startsAt && now < discount.startsAt) {
    return reject('Este código de desconto ainda não está disponível.');
  }
  if (discount.expiresAt && now > discount.expiresAt) return reject('Este código de desconto expirou.');
  if (discount.maxUses != null && discount.usedCount >= discount.maxUses) {
    return reject('Este código de desconto já atingiu o limite de utilizações.');
  }
  if (discount.minOrderAmount != null && subtotal < discount.minOrderAmount) {
    return reject(`Este código exige uma compra mínima de €${discount.minOrderAmount.toFixed(2)}.`);
  }

  const raw = discount.type === 'PERCENTAGE' ? (subtotal * discount.value) / 100 : discount.value;
  return { amount: roundCents(Math.min(Math.max(raw, 0), subtotal)), reason: null };
}
