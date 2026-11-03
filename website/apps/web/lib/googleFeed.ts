import type { Locale } from '@/i18n/config';
import { localizePath } from '@/i18n/routing';
import { BASE_URL } from '@/lib/seo';

// Feed de produtos para o Google Merchant Center (RSS 2.0 + namespace g:)
// https://support.google.com/merchants/answer/7052112

export const FEED_REVALIDATE_SECONDS = 3600;

const BRAND = 'ReaxOne';
const TITLE_MAX = 150;
const DESCRIPTION_MAX = 5000;
const MAX_ADDITIONAL_IMAGES = 10;

const CATEGORY_SOCKS = 'Apparel & Accessories > Clothing > Underwear & Socks > Socks';
const CATEGORY_FITNESS = 'Sporting Goods > Exercise & Fitness';

// Atributos obrigatórios para vestuário (meias)
const SOCKS_SIZE: Record<Locale, string> = { pt: 'Tamanho único', en: 'One size' };
const SOCKS_GENDER = 'unisex';
const SOCKS_AGE_GROUP = 'adult';

interface FeedProduct {
  name: string;
  nameEn?: string | null;
  slug: string;
  description?: string | null;
  descriptionEn?: string | null;
  color?: string | null;
  colorEn?: string | null;
  groupId?: string | null;
  price: number;
  images: string[];
  stock: number;
  isEbook?: boolean;
  category?: { name: string; slug: string } | null;
}

const CHANNEL_COPY: Record<Locale, { title: string; description: string }> = {
  pt: { title: 'ReaxOne — Loja', description: 'Produtos ReaxOne' },
  en: { title: 'ReaxOne — Shop', description: 'ReaxOne products' },
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    // caracteres de controlo inválidos em XML 1.0
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
}

function plainText(text: string, max: number): string {
  const clean = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return clean.length <= max ? clean : clean.slice(0, max - 1).trimEnd() + '…';
}

function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return encodeURI(path);
  return encodeURI(`${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`);
}

function isSocks(p: FeedProduct): boolean {
  const haystack = `${p.category?.slug ?? ''} ${p.category?.name ?? ''} ${p.slug}`.toLowerCase();
  return /meia|sock/.test(haystack);
}

function tag(name: string, value: string | undefined | null): string {
  return value ? `      <g:${name}>${escapeXml(value)}</g:${name}>\n` : '';
}

function renderItem(p: FeedProduct, locale: Locale): string {
  const isEn = locale === 'en';
  const title = plainText((isEn && p.nameEn?.trim()) || p.name, TITLE_MAX);
  // `||`: uma descrição vazia cai para a do outro idioma e, por fim, para o título
  const description = plainText(
    (isEn ? p.descriptionEn || p.description : p.description) || title,
    DESCRIPTION_MAX,
  );
  const color = ((isEn && p.colorEn?.trim()) || p.color?.trim()) ?? '';
  const [mainImage, ...extraImages] = p.images.filter(Boolean);
  const socks = isSocks(p);

  return (
    '    <item>\n' +
    tag('id', p.slug) +
    tag('title', title) +
    tag('description', description) +
    tag('link', `${BASE_URL}${localizePath(locale, `/loja/${p.slug}`)}`) +
    tag('image_link', mainImage ? absoluteUrl(mainImage) : undefined) +
    extraImages.slice(0, MAX_ADDITIONAL_IMAGES).map((img) => tag('additional_image_link', absoluteUrl(img))).join('') +
    tag('price', `${p.price.toFixed(2)} EUR`) +
    tag('availability', p.stock > 0 ? 'in_stock' : 'out_of_stock') +
    tag('condition', 'new') +
    tag('brand', BRAND) +
    tag('identifier_exists', 'no') +
    tag('google_product_category', socks ? CATEGORY_SOCKS : CATEGORY_FITNESS) +
    tag('item_group_id', p.groupId?.trim()) +
    tag('color', color) +
    (socks
      ? tag('size', SOCKS_SIZE[locale]) + tag('gender', SOCKS_GENDER) + tag('age_group', SOCKS_AGE_GROUP)
      : '') +
    '    </item>\n'
  );
}

export function buildGoogleFeed(products: FeedProduct[], locale: Locale): string {
  // Ebooks (produtos digitais) ficam de fora do Google Shopping
  const items = products.filter((p) => !p.isEbook).map((p) => renderItem(p, locale)).join('');
  const channel = CHANNEL_COPY[locale];

  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n' +
    '  <channel>\n' +
    `    <title>${escapeXml(channel.title)}</title>\n` +
    `    <link>${BASE_URL}${localizePath(locale, '/loja')}</link>\n` +
    `    <description>${escapeXml(channel.description)}</description>\n` +
    items +
    '  </channel>\n' +
    '</rss>\n'
  );
}

// Resposta HTTP do feed. Se a API falhar devolve 503 (e não um feed vazio),
// para o Google não desativar os produtos por engano.
export async function googleFeedResponse(locale: Locale): Promise<Response> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  try {
    const res = await fetch(`${apiUrl}/products`, { next: { revalidate: FEED_REVALIDATE_SECONDS } });
    if (!res.ok) throw new Error(`API respondeu ${res.status}`);
    const products: FeedProduct[] = await res.json();
    return new Response(buildGoogleFeed(products, locale), {
      headers: { 'Content-Type': 'application/xml; charset=utf-8' },
    });
  } catch (error) {
    console.error(`[google-feed:${locale}] falha ao obter produtos`, error);
    return new Response('Feed temporariamente indisponível', {
      status: 503,
      headers: { 'Retry-After': '3600' },
    });
  }
}
