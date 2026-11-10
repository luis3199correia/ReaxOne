/**
 * Regras puras (sem IO) para emitir a fatura de uma encomenda no Facturalusa.
 * Os preços da loja já incluem IVA, por isso a venda vai com "IVA incluído".
 */

export const GENERIC_VAT_NUMBER = '999999990';
export const GENERIC_CUSTOMER_NAME = 'Consumidor final';
export const DOCUMENT_TYPE = 'Factura Recibo';
export const VAT_TYPE = 'IVA incluído';
export const VAT_RATE = 23;
export const EXTERNAL_REFERENCE_PREFIX = 'REAXONE-';
export const SHIPPING_ARTICLE = { reference: 'PORTES', description: 'Portes de envio', type: 'Serviços' } as const;
export const PRODUCT_ARTICLE_TYPE = 'Mercadorias';
export const ARTICLE_UNIT = 'uni';

const TOTAL_TOLERANCE = 0.01;
const DISCOUNT_DECIMALS = 6;
const DETAILS_MAX_LENGTH = 255;
const ARTICLE_REFERENCE_MAX_LENGTH = 60;  // limites SAF-T (changelog 2026-10-18)
const ARTICLE_DESCRIPTION_MAX_LENGTH = 200;
const CUSTOMER_NAME_MAX_LENGTH = 200;
const LISBON_TIME_ZONE = 'Europe/Lisbon';

export type InvoiceStatus = 'ISSUED' | 'DRAFT' | 'FAILED';
export type CustomerType = 'Particular' | 'Empresarial';

export interface InvoiceOrderLine {
  productId: string;
  name: string;
  price: number;      // unitário, com IVA
  quantity: number;
  size: string | null;
  isGift: boolean;
}

export interface InvoiceOrder {
  id: string;
  totalAmount: number;
  email: string;
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  wantsInvoice: boolean;
  nif: string | null;
  companyName: string | null;
  shippingCost: number;
  discountAmount: number;
  items: InvoiceOrderLine[];
}

export type CustomerSpec =
  | { kind: 'generic' }
  | { kind: 'nif'; vatNumber: string; name: string; type: CustomerType };

export interface SaleItem {
  id: number;
  price: number;
  quantity: number;
  vat: number;
  discount?: number;
  details?: string;
}

export interface SalePayload {
  issue_date: string;
  document_type: string;
  serie?: string;
  customer: number;
  vat_number?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  vat_type: string;
  items: SaleItem[];
  status: 'Rascunho' | 'Terminado';
  external_reference: string;
  force_send_email: boolean;
}

export interface InvoiceSettingsInput {
  draft: boolean;
  series: string; // '' = série por omissão
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** NIF sem espaços nem prefixo "PT". */
export function normalizeVatNumber(raw: string | null | undefined): string {
  return (raw ?? '').replace(/\s+/g, '').replace(/^PT/i, '');
}

/** Fatura com NIF só quando o cliente a pediu; caso contrário vai para o consumidor final. */
export function selectCustomer(order: InvoiceOrder): CustomerSpec {
  const vatNumber = normalizeVatNumber(order.nif);
  if (!order.wantsInvoice || !vatNumber || vatNumber === GENERIC_VAT_NUMBER) return { kind: 'generic' };
  const company = order.companyName?.trim() ?? '';
  const name = (company || `${order.firstName} ${order.lastName}`.trim()).slice(0, CUSTOMER_NAME_MAX_LENGTH);
  return { kind: 'nif', vatNumber, name, type: company ? 'Empresarial' : 'Particular' };
}

export function buildCustomerPayload(spec: Extract<CustomerSpec, { kind: 'nif' }>, order: InvoiceOrder) {
  return {
    name:        spec.name,
    vat_number:  spec.vatNumber,
    type:        spec.type,
    vat_type:    VAT_TYPE,
    country:     order.country,
    address:     order.street,
    city:        order.city,
    postal_code: order.postalCode,
    email:       order.email,
  };
}

export function genericCustomerPayload() {
  return { name: GENERIC_CUSTOMER_NAME, vat_number: GENERIC_VAT_NUMBER, type: 'Particular' as CustomerType, vat_type: VAT_TYPE, country: 'PT' };
}

export function productArticlePayload(product: { slug: string; name: string }) {
  return {
    reference:   articleReference(product.slug),
    description: product.name.slice(0, ARTICLE_DESCRIPTION_MAX_LENGTH),
    unit:        ARTICLE_UNIT,
    vat:         VAT_RATE,
    type:        PRODUCT_ARTICLE_TYPE,
  };
}

export function shippingArticlePayload() {
  return {
    reference:   SHIPPING_ARTICLE.reference,
    description: SHIPPING_ARTICLE.description,
    unit:        ARTICLE_UNIT,
    vat:         VAT_RATE,
    type:        SHIPPING_ARTICLE.type,
  };
}

export function articleReference(slug: string): string {
  return slug.slice(0, ARTICLE_REFERENCE_MAX_LENGTH);
}

export function externalReference(orderId: string): string {
  return `${EXTERNAL_REFERENCE_PREFIX}${orderId}`;
}

/** Data (AAAA-MM-DD) no fuso de Lisboa. */
export function lisbonDate(now: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: LISBON_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now);
}

function paidItemsTotal(order: InvoiceOrder): number {
  return order.items.filter((i) => !i.isGift).reduce((acc, i) => acc + i.price * i.quantity, 0);
}

/**
 * O desconto da encomenda (em €) passa a uma percentagem igual em todas as
 * linhas pagas — os portes nunca têm desconto.
 */
export function discountPercent(order: InvoiceOrder): number {
  const itemsTotal = paidItemsTotal(order);
  if (order.discountAmount <= 0 || itemsTotal <= 0) return 0;
  const pct = Math.min(100, (order.discountAmount / itemsTotal) * 100);
  return Number(pct.toFixed(DISCOUNT_DECIMALS));
}

function lineDetails(line: InvoiceOrderLine): string | undefined {
  const parts = [line.size ? `Tamanho: ${line.size}` : null, line.isGift ? 'Oferta' : null].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ').slice(0, DETAILS_MAX_LENGTH) : undefined;
}

function buildLine(line: InvoiceOrderLine, articleId: number | undefined, discount: number): SaleItem {
  if (!articleId) throw new Error(`Falta o artigo do Facturalusa para "${line.name}".`);
  const details = lineDetails(line);
  return {
    id:       articleId,
    price:    line.isGift ? 0 : line.price,
    quantity: line.quantity,
    vat:      VAT_RATE,
    ...(!line.isGift && discount > 0 ? { discount } : {}),
    ...(details ? { details } : {}),
  };
}

function shippingLine(cost: number, articleId: number | null): SaleItem {
  if (!articleId) throw new Error('Falta o artigo do Facturalusa para os portes.');
  return { id: articleId, price: cost, quantity: 1, vat: VAT_RATE };
}

export function buildSalePayload(input: {
  order: InvoiceOrder;
  customerId: number;
  articleIds: Record<string, number>;
  shippingArticleId: number | null;
  settings: InvoiceSettingsInput;
  issueDate: string;
}): SalePayload {
  const { order, settings } = input;
  const discount = discountPercent(order);
  const productLines = order.items.map((line) => buildLine(line, input.articleIds[line.productId], discount));
  const lines = order.shippingCost > 0 ? [...productLines, shippingLine(order.shippingCost, input.shippingArticleId)] : productLines;

  const spec = selectCustomer(order);
  const series = settings.series.trim();
  // O email é enviado à parte (sendSaleEmail), para chegar também ao consumidor final
  return {
    issue_date:   input.issueDate,
    document_type: DOCUMENT_TYPE,
    ...(series ? { serie: series } : {}),
    customer:     input.customerId,
    ...(spec.kind === 'nif'
      ? { vat_number: spec.vatNumber, address: order.street, city: order.city, postal_code: order.postalCode, country: order.country }
      : {}),
    vat_type:     VAT_TYPE,
    items:        lines,
    status:       settings.draft ? 'Rascunho' : 'Terminado',
    external_reference: externalReference(order.id),
    force_send_email: false,
  };
}

/** Total esperado da venda (preços com IVA incluído). */
export function expectedSaleTotal(payload: Pick<SalePayload, 'items'>): number {
  return round2(payload.items.reduce(
    (acc, i) => acc + i.price * i.quantity * (1 - (i.discount ?? 0) / 100),
    0,
  ));
}

export function totalsMatch(expected: number, actual: number): boolean {
  return Math.abs(round2(expected) - round2(actual)) <= TOTAL_TOLERANCE + 1e-9;
}

/** Motivo para não emitir (antes de qualquer pedido à API), ou null. */
export function invoiceBlocker(order: InvoiceOrder): string | null {
  if (order.totalAmount <= 0) return 'Encomenda com total 0 € — o Facturalusa não emite documentos sem valor.';
  const discount = discountPercent(order);
  const expected = round2(
    paidItemsTotal(order) * (1 - discount / 100) + Math.max(0, order.shippingCost),
  );
  if (!totalsMatch(expected, order.totalAmount)) {
    return `As linhas da fatura (${expected.toFixed(2)} €) não correspondem ao total da encomenda (${order.totalAmount.toFixed(2)} €).`;
  }
  return null;
}

/** Aviso guardado quando o Facturalusa devolve um total diferente do da encomenda. */
export function totalMismatchNote(saleTotal: number, orderTotal: number): string | null {
  if (totalsMatch(orderTotal, saleTotal)) return null;
  return `Total no Facturalusa (${saleTotal.toFixed(2)} €) diferente do da encomenda (${orderTotal.toFixed(2)} €).`;
}

/** Estado local a partir do estado devolvido pelo Facturalusa. */
export function invoiceStatusFromSale(status: unknown): InvoiceStatus {
  return status === 'Rascunho' ? 'DRAFT' : 'ISSUED';
}
