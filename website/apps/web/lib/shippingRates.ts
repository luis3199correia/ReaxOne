// Portes: as opções e os preços vêm da Batch (POST /shipping/options na API, que chama
// dispatch/availability e soma o IVA). Aqui ficam só as zonas (países e portes grátis).
// A API recalcula os portes ao criar a encomenda (apps/api/src/orders/shipping-rates.ts).

export type ShippingZone =
  | 'PT_CONTINENTAL'
  | 'PT_ILHAS'
  | 'ES_CONTINENTAL'
  | 'ES_ILHAS'
  | 'ZONA2'
  | 'ZONA3'
  | 'BLOCKED';

/** Opção de envio da Batch, como vem da API (preço com IVA, sem portes grátis). */
export interface ShippingOption {
  id: string;            // service_code da Batch (ex.: BL-14, BL-12-8810769)
  name: string;          // service_name da Batch
  price: number;         // com IVA
  isPickupPoint: boolean;
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

/** Aplica os portes grátis da zona (o subtotal conta antes do desconto, como na API). */
export function applyFreeShipping(
  options: ShippingOption[],
  zone: ShippingZone,
  subtotal: number,
  thresholds: FreeShippingThresholds,
): ShippingOption[] {
  const freeAbove = freeShippingThresholdFor(zone, thresholds);
  if (freeAbove > 0 && subtotal >= freeAbove) return options.map((o) => ({ ...o, price: 0 }));
  return options;
}

// Países por zona
const ZONA2 = new Set(['AT', 'BE', 'CZ', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LT', 'NL', 'SI', 'SK']);
const ZONA3 = new Set(['DK', 'EE', 'FI', 'LV', 'MT', 'PL', 'SE']);

export function detectZone(country: string, zip: string): ShippingZone {
  const clean = zip.replace(/\D/g, '');

  if (country === 'PT') {
    // Açores e Madeira: códigos postais começam por 9
    return clean.startsWith('9') ? 'PT_ILHAS' : 'PT_CONTINENTAL';
  }

  if (country === 'ES') {
    const prefix = clean.slice(0, 2);
    // Baleares: 07xxx | Canárias: 35xxx, 38xxx
    return prefix === '07' || prefix === '35' || prefix === '38'
      ? 'ES_ILHAS'
      : 'ES_CONTINENTAL';
  }

  if (ZONA2.has(country)) return 'ZONA2';
  if (ZONA3.has(country)) return 'ZONA3';

  return 'BLOCKED';
}

// Lista de países disponíveis para o dropdown
export const COUNTRY_OPTIONS: { value: string; label: string; disabled?: boolean }[] = [
  { value: 'PT', label: 'Portugal' },
  { value: 'ES', label: 'Espanha' },
  { value: '__sep__', label: '──────────────', disabled: true },
  { value: 'AT', label: 'Áustria' },
  { value: 'BE', label: 'Bélgica' },
  { value: 'CZ', label: 'República Checa' },
  { value: 'DK', label: 'Dinamarca' },
  { value: 'EE', label: 'Estónia' },
  { value: 'FI', label: 'Finlândia' },
  { value: 'FR', label: 'França' },
  { value: 'DE', label: 'Alemanha' },
  { value: 'GR', label: 'Grécia' },
  { value: 'HU', label: 'Hungria' },
  { value: 'IE', label: 'Irlanda' },
  { value: 'IT', label: 'Itália' },
  { value: 'LV', label: 'Letónia' },
  { value: 'LT', label: 'Lituânia' },
  { value: 'MT', label: 'Malta' },
  { value: 'NL', label: 'Países Baixos' },
  { value: 'PL', label: 'Polónia' },
  { value: 'SI', label: 'Eslovénia' },
  { value: 'SK', label: 'Eslováquia' },
  { value: 'SE', label: 'Suécia' },
];

export const ZONE_LABELS: Record<ShippingZone, string> = {
  PT_CONTINENTAL: 'Portugal Continental',
  PT_ILHAS:       'Portugal — Ilhas',
  ES_CONTINENTAL: 'Espanha Continental',
  ES_ILHAS:       'Ilhas Espanholas',
  ZONA2:          'Europa Zona 2',
  ZONA3:          'Europa Zona 3',
  BLOCKED:        'País não suportado',
};
