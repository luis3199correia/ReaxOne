import type { Locale } from '@/i18n/config';
import { localizePath } from '@/i18n/routing';
import { BASE_URL, absoluteUrl } from '@/lib/seo';

// Dados estruturados schema.org/Product para a página do produto.
// O Google lê daqui as imagens, o preço e a disponibilidade quando cria
// ofertas a partir do site. Mantém-se igual ao feed (id = slug, mesmas imagens).
// https://developers.google.com/search/docs/appearance/structured-data/product

const BRAND = 'ReaxOne';
const NAME_MAX = 150;
const DESCRIPTION_MAX = 5000;
const SCHEMA_IN_STOCK = 'https://schema.org/InStock';
const SCHEMA_OUT_OF_STOCK = 'https://schema.org/OutOfStock';
const SCHEMA_NEW = 'https://schema.org/NewCondition';

export interface JsonLdProduct {
  name: string;
  nameEn?: string | null;
  slug: string;
  description?: string | null;
  descriptionEn?: string | null;
  color?: string | null;
  colorEn?: string | null;
  groupId?: string | null;
  price: number;
  images?: string[] | null;
  stock: number;
  isEbook?: boolean;
}

function plainText(text: string, max: number): string {
  const clean = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return clean.length <= max ? clean : clean.slice(0, max - 1).trimEnd() + '…';
}

/**
 * Objeto JSON-LD do produto, ou null para ebooks (produtos digitais ficam
 * fora do Google Shopping, como no feed).
 */
export function buildProductJsonLd(p: JsonLdProduct, locale: Locale): Record<string, unknown> | null {
  if (p.isEbook) return null;

  const isEn = locale === 'en';
  const name = plainText((isEn && p.nameEn?.trim()) || p.name, NAME_MAX);
  const description = plainText((isEn ? p.descriptionEn || p.description : p.description) || name, DESCRIPTION_MAX);
  const color = ((isEn && p.colorEn?.trim()) || p.color?.trim()) || undefined;
  const url = `${BASE_URL}${localizePath(locale, `/loja/${p.slug}`)}`;
  const images = (p.images ?? []).filter(Boolean).map(absoluteUrl);

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    sku: p.slug,
    name,
    description,
    url,
    ...(images.length > 0 && { image: images }),
    brand: { '@type': 'Brand', name: BRAND },
    ...(color && { color }),
    ...(p.groupId?.trim() && { inProductGroupWithID: p.groupId.trim() }),
    offers: {
      '@type': 'Offer',
      url,
      price: p.price.toFixed(2),
      priceCurrency: 'EUR',
      availability: p.stock > 0 ? SCHEMA_IN_STOCK : SCHEMA_OUT_OF_STOCK,
      itemCondition: SCHEMA_NEW,
    },
  };
}

/** JSON seguro para <script>: `<` escapado para um texto nunca fechar a tag. */
export function jsonLdScript(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
