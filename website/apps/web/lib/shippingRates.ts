// Tabela de preços derivada de tabela_precos.csv
// Preços base sem IVA — IVA (23%) adicionado em getShippingOptions()

export const IVA_RATE = 0.23;

export type ShippingZone =
  | 'PT_CONTINENTAL'
  | 'PT_ILHAS'
  | 'ES_CONTINENTAL'
  | 'ES_ILHAS'
  | 'ZONA2'
  | 'ZONA3'
  | 'BLOCKED';

export interface ShippingOption {
  id: string;
  name: string;
  priceBase: number; // sem IVA
  price: number;     // com IVA (23%)
  deliveryDays: string;
}

// Apenas entradas NÃO desativadas no CSV
const RAW: Record<Exclude<ShippingZone, 'BLOCKED'>, Omit<ShippingOption, 'price'>[]> = {
  PT_CONTINENTAL: [
    { id: 'pt_2d_1t', name: 'Envio 2 dias — 1 Tentativa de Entrega', priceBase: 4.01, deliveryDays: '2' },
  ],
  PT_ILHAS: [
    { id: 'pt_ilhas_59', name: 'Envio Ilhas — 5 a 9 dias', priceBase: 8.91, deliveryDays: '5-9' },
  ],
  ES_CONTINENTAL: [
    { id: 'es_std', name: 'Envio para Espanha', priceBase: 5.96, deliveryDays: '3-5' },
  ],
  ES_ILHAS: [
    { id: 'es_ilhas_610', name: 'Ilhas Espanholas — 6 a 10 dias', priceBase: 10.96, deliveryDays: '6-10' },
    { id: 'es_ilhas_35',  name: 'Ilhas Espanholas — 3 a 5 dias',  priceBase: 11.78, deliveryDays: '3-5' },
  ],
  ZONA2: [
    { id: 'eu_z2', name: 'Europa Zona 2 — Economy', priceBase: 12.53, deliveryDays: '5-8' },
  ],
  ZONA3: [
    { id: 'eu_z3', name: 'Europa Zona 3 — Economy', priceBase: 13.35, deliveryDays: '7-10' },
  ],
};

function addIVA(opts: Omit<ShippingOption, 'price'>[]): ShippingOption[] {
  return opts.map((o) => ({
    ...o,
    price: Math.round(o.priceBase * (1 + IVA_RATE) * 100) / 100,
  }));
}

export function getShippingOptions(zone: ShippingZone): ShippingOption[] {
  if (zone === 'BLOCKED') return [];
  return addIVA(RAW[zone]);
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
