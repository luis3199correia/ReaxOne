import { serverApiUrl } from '@/lib/serverApi';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { localeAlternates } from '@/lib/seo';
import { buildProductJsonLd, jsonLdScript, type JsonLdProduct } from '@/lib/productJsonLd';
import type { Locale } from '@/i18n/config';

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

const META_DESCRIPTION_MAX = 160;

// Texto corrido e curto para a meta description (o Google corta perto dos 160 caracteres)
function summarize(text?: string | null): string {
  const clean = (text ?? '').replace(/\s+/g, ' ').trim();
  if (clean.length <= META_DESCRIPTION_MAX) return clean;
  return clean.slice(0, META_DESCRIPTION_MAX - 1).replace(/\s+\S*$/, '') + '…';
}

const HTTP_NOT_FOUND = 404;

// Mesmo URL e opções em generateMetadata e no layout → o Next deduplica o pedido
function fetchProduct(slug: string) {
  const apiUrl = serverApiUrl();
  return fetch(`${apiUrl}/products/${encodeURIComponent(slug)}`, { next: { revalidate: 3600 } });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const alternates = localeAlternates(locale, `/loja/${slug}`);

  try {
    const res = await fetchProduct(slug);
    // Produto inexistente: sem canonical/hreflang a apontar para um URL que dá 404
    // (anula explicitamente os herdados do layout /loja)
    if (res.status === HTTP_NOT_FOUND) {
      return {
        title: locale === 'en' ? 'Product not found' : 'Produto não encontrado',
        alternates: { canonical: null, languages: {} },
      };
    }
    if (!res.ok) throw new Error();
    const p: {
      name: string; nameEn?: string; description?: string; descriptionEn?: string; images: string[]; price: number;
    } = await res.json();

    const isEn = locale === 'en';
    const name = (isEn && p.nameEn?.trim()) || p.name;
    // `||` e não `??`: uma descrição vazia também tem de cair no texto por omissão
    const description = summarize((isEn && p.descriptionEn) || p.description)
      || (isEn
        ? `${name} — €${p.price.toFixed(2)}. Order now from ReaxOne.`
        : `${name} — €${p.price.toFixed(2)}. Encomenda agora na ReaxOne.`);

    return {
      title: name,
      description,
      alternates,
      openGraph: {
        title: `${name} | ReaxOne`,
        description,
        images: p.images?.[0]
          // sem width/height: as fotos têm tamanhos variados e dimensões erradas confundem os crawlers
          ? [{ url: p.images[0], alt: name }]
          : [{ url: '/images/og/og-default.jpg', width: 1200, height: 630, alt: name }],
      },
    };
  } catch {
    return { title: 'Produto | ReaxOne', alternates };
  }
}

// Slug inexistente → 404 a sério (antes era 200 com "produto não encontrado", um soft 404
// que o Google tratava como página duplicada). Só com 404 explícito da API: se a API
// estiver em baixo, a página continua a renderizar em vez de desindexar produtos válidos.
export default async function ProductLayout({ children, params }: Props & { children: React.ReactNode }) {
  const { locale, slug } = await params;
  const res = await fetchProduct(slug).catch(() => null);
  if (res?.status === HTTP_NOT_FOUND) notFound();

  // Dados estruturados (imagens, preço, stock) no HTML do servidor — a página é client-side
  const product: JsonLdProduct | null = res?.ok ? await res.json().catch(() => null) : null;
  const jsonLd = product ? buildProductJsonLd(product, locale as Locale) : null;

  return (
    <>
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
      )}
      {children}
    </>
  );
}
