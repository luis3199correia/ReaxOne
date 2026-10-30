// Cópia server-side de apps/web/lib/shippingRates.ts — os portes são recalculados
// aqui para não confiar no valor enviado pelo browser. Manter as duas em sincronia.

const IVA_RATE = 0.23;

export type ShippingZone =
  | 'PT_CONTINENTAL'
  | 'PT_ILHAS'
  | 'ES_CONTINENTAL'
  | 'ES_ILHAS'
  | 'ZONA2'
  | 'ZONA3'
  | 'BLOCKED';

// Preços base sem IVA
const RATES: Record<Exclude<ShippingZone, 'BLOCKED'>, { id: string; priceBase: number }[]> = {
  PT_CONTINENTAL: [{ id: 'pt_2d_1t', priceBase: 4.01 }],
  PT_ILHAS:       [{ id: 'pt_ilhas_59', priceBase: 8.91 }],
  ES_CONTINENTAL: [{ id: 'es_std', priceBase: 5.96 }],
  ES_ILHAS:       [{ id: 'es_ilhas_610', priceBase: 10.96 }, { id: 'es_ilhas_35', priceBase: 11.78 }],
  ZONA2:          [{ id: 'eu_z2', priceBase: 12.53 }],
  ZONA3:          [{ id: 'eu_z3', priceBase: 13.35 }],
};

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

/**
 * Preço (IVA incluído) do método de envio escolhido, ou null se o método não
 * existir para a zona. Ilhas portuguesas e países bloqueados não têm envio online.
 * `freeAbove` é o subtotal (configurado no backoffice) a partir do qual os portes
 * em Portugal Continental são grátis; 0 desativa.
 */
export function shippingPrice(zone: ShippingZone, methodId: string, subtotal: number, freeAbove: number): number | null {
  if (zone === 'BLOCKED' || zone === 'PT_ILHAS') return null;
  const rate = RATES[zone].find((r) => r.id === methodId);
  if (!rate) return null;
  if (zone === 'PT_CONTINENTAL' && freeAbove > 0 && subtotal >= freeAbove) return 0;
  return Math.round(rate.priceBase * (1 + IVA_RATE) * 100) / 100;
}
