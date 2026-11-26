import { isEbookProduct } from './free-ebook';

// SKUs dos produtos e exportação do catálogo para importar na Batch
// (formato do products_template.csv da Batch).

const SKU_PREFIX = 'RX-';
const SKU_DIGITS = 4;
const SKU_PATTERN = /^RX-(\d+)$/;
const DEFAULT_SITE_URL = 'https://reaxone.com';

export const BATCH_CSV_HEADER = [
  'BARCODE', 'NAME', 'SKU', 'ECOMMERCE SKU', 'ECOMMERCE ID', 'PRICE', 'URL DA IMAGEM', 'BUNDLE (0/1)',
] as const;

/** Próximo SKU automático (RX-0001, RX-0002, …) a partir dos que já existem. */
export function nextSku(existing: Array<string | null | undefined>): string {
  const max = existing.reduce((acc, sku) => {
    const match = sku ? SKU_PATTERN.exec(sku) : null;
    return match ? Math.max(acc, Number(match[1])) : acc;
  }, 0);
  return `${SKU_PREFIX}${String(max + 1).padStart(SKU_DIGITS, '0')}`;
}

export interface CatalogProduct {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  images: string[];
  ebookFile?: string | null;
  ebookFileEn?: string | null;
  category?: { slug?: string | null } | null;
}

/** Campo CSV: entre aspas quando tem vírgula, aspas ou quebra de linha. */
function csvField(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function imageUrl(path: string | undefined, siteUrl: string): string {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return encodeURI(path);
  return encodeURI(`${siteUrl}${path.startsWith('/') ? '' : '/'}${path}`);
}

/**
 * CSV para importar na Batch: só produtos físicos (os ebooks não são enviados),
 * ativos ou não — produtos de oferta também saem do armazém.
 */
export function buildBatchCatalogCsv(products: CatalogProduct[], siteUrl = DEFAULT_SITE_URL): string {
  const base = siteUrl.replace(/\/+$/, '');
  const rows = products
    .filter((p) => !isEbookProduct(p))
    .map((p) => [
      '',                              // BARCODE: ainda sem EAN
      p.name,
      p.sku ?? '',
      p.sku ?? '',
      p.id,
      p.price.toFixed(2),
      imageUrl(p.images?.[0], base),
      '0',                             // BUNDLE
    ].map(csvField).join(','));
  return [BATCH_CSV_HEADER.join(','), ...rows].join('\n') + '\n';
}
