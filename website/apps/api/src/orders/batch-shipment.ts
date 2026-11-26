// Dados do envio no formato da Batch (dispatch/order/create).
import { PICKUP_METHOD_ID } from './pickup';
import { BATCH_STATUS } from '../batch/batch.service';

// A Batch espera o país em inglês (por omissão assume Portugal).
const COUNTRY_NAMES: Record<string, string> = {
  PT: 'Portugal', ES: 'Spain',
  AT: 'Austria', BE: 'Belgium', CZ: 'Czech Republic', FR: 'France', DE: 'Germany', GR: 'Greece',
  HU: 'Hungary', IE: 'Ireland', IT: 'Italy', LT: 'Lithuania', NL: 'Netherlands', SI: 'Slovenia', SK: 'Slovakia',
  DK: 'Denmark', EE: 'Estonia', FI: 'Finland', LV: 'Latvia', MT: 'Malta', PL: 'Poland', SE: 'Sweden',
};

/** Nome do país em inglês a partir do código ISO (ex.: ES → Spain). */
export function batchCountryName(countryCode: string | null | undefined): string {
  const code = (countryCode ?? 'PT').trim().toUpperCase();
  return COUNTRY_NAMES[code] ?? code;
}

export interface CartLine {
  name: string;
  sku: string | null;
  quantity: number;
}

/**
 * Carrinho da Batch: { "Nome // SKU": quantidade }. A Batch identifica o artigo
 * pelo SKU do catálogo; o mesmo produto (comprado e de oferta) soma quantidades.
 */
export function batchCart(lines: CartLine[]): { items: Record<string, number>; missingSku: string[] } {
  const items: Record<string, number> = {};
  const missingSku: string[] = [];
  for (const line of lines) {
    if (!line.sku) missingSku.push(line.name);
    const key = line.sku ? `${line.name} // ${line.sku}` : line.name;
    items[key] = (items[key] ?? 0) + line.quantity;
  }
  return { items, missingSku: [...new Set(missingSku)] };
}

/**
 * Encomenda paga que ainda tem de ir para a Batch: entrega por transportadora
 * (o levantamento no clube não) e ainda sem número da Batch.
 */
export function needsBatchShipment(order: { shippingMethod?: string | null; batchOrderNumber?: string | null }): boolean {
  return order.shippingMethod !== PICKUP_METHOD_ID && !order.batchOrderNumber;
}

/** Encomenda na Batch à espera de ser marcada no backoffice como pronta para recolha. */
export function canMarkReadyForPickup(order: {
  status?: string | null; batchOrderNumber?: string | null; batchStatus?: string | null;
}): boolean {
  return !!order.batchOrderNumber && order.batchStatus === BATCH_STATUS.ON_HOLD && order.status !== 'CANCELLED';
}
