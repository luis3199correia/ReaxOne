// Regras de portes no servidor. Os métodos e preços vêm da Batch (dispatch/availability,
// sem IVA); aqui só se decide a zona (países permitidos e portes grátis), o IVA e o
// preço final, para nunca confiar no valor enviado pelo browser.
// Manter em sincronia com apps/web/lib/shippingRates.ts.

import type { BatchAvailabilityOption } from '../batch/batch.service';

const IVA_RATE = 0.23;

export type ShippingZone =
  | 'PT_CONTINENTAL'
  | 'PT_ILHAS'
  | 'ES_CONTINENTAL'
  | 'ES_ILHAS'
  | 'ZONA2'
  | 'ZONA3'
  | 'BLOCKED';

const ZONA2 = new Set(['AT', 'BE', 'CZ', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LT', 'NL', 'SI', 'SK']);
const ZONA3 = new Set(['DK', 'EE', 'FI', 'LV', 'MT', 'PL', 'SE']);

export function detectZone(country: string, zip: string): ShippingZone {
  const clean = (zip ?? '').replace(/\D/g, '');

  if (country === 'PT') {
    return clean.startsWith('9') ? 'PT_ILHAS' : 'PT_CONTINENTAL';
  }
  if (country === 'ES') {
    const prefix = clean.slice(0, 2);
    return prefix === '07' || prefix === '35' || prefix === '38' ? 'ES_ILHAS' : 'ES_CONTINENTAL';
  }
  if (ZONA2.has(country)) return 'ZONA2';
  if (ZONA3.has(country)) return 'ZONA3';
  return 'BLOCKED';
}

// Subtotais (configurados no backoffice) a partir dos quais os portes são grátis; 0 desativa
export interface FreeShippingThresholds {
  pt: number; // Portugal Continental
  es: number; // Espanha (continental, Baleares e Canárias)
  eu: number; // Restantes países da UE
}

// Açores e Madeira não têm portes grátis
export function freeShippingThresholdFor(zone: ShippingZone, thresholds: FreeShippingThresholds): number {
  switch (zone) {
    case 'PT_CONTINENTAL': return thresholds.pt;
    case 'ES_CONTINENTAL':
    case 'ES_ILHAS': return thresholds.es;
    case 'ZONA2':
    case 'ZONA3': return thresholds.eu;
    default: return 0;
  }
}

/** Preço da Batch (sem IVA) com IVA, arredondado ao cêntimo. */
export function priceWithVat(priceBase: number): number {
  return Math.round(priceBase * (1 + IVA_RATE) * 100) / 100;
}

export interface ShippingQuote {
  serviceCode: string;
  serviceName: string;
  price: number; // com IVA, já com portes grátis aplicados
}

/**
 * Preço final do método escolhido, ou null se não existir para este destino.
 * Portes grátis quando o subtotal dos produtos atinge o limite da zona.
 */
export function quoteShipping(
  options: BatchAvailabilityOption[],
  serviceCode: string | undefined,
  zone: ShippingZone,
  subtotal: number,
  thresholds: FreeShippingThresholds,
): ShippingQuote | null {
  if (zone === 'BLOCKED' || !serviceCode) return null;
  const option = options.find((o) => o.serviceCode === serviceCode);
  if (!option) return null;
  const freeAbove = freeShippingThresholdFor(zone, thresholds);
  const price = freeAbove > 0 && subtotal >= freeAbove ? 0 : priceWithVat(option.priceBase);
  return { serviceCode: option.serviceCode, serviceName: option.serviceName, price };
}

/**
 * Método a usar na Batch. Encomendas antigas (antes dos portes da Batch) guardaram
 * o id da nossa tabela (ex.: pt_2d_1t): usa a entrega ao domicílio do destino.
 */
export function batchServiceCode(shippingMethod: string | null | undefined, options: BatchAvailabilityOption[]): string | null {
  if (shippingMethod && /^BL-/.test(shippingMethod)) return shippingMethod;
  return options.find((o) => !o.isPickupPoint)?.serviceCode ?? null;
}
