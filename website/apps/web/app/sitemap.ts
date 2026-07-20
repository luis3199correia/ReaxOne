import { MetadataRoute } from 'next';

const BASE_URL = 'https://reaxone.com';
const locales = ['pt', 'en'] as const;

// Rotas públicas indexáveis
const staticRoutes = [
  { path: '',        priority: 1.0, changeFrequency: 'weekly'  as const },
  { path: '/loja',   priority: 0.9, changeFrequency: 'weekly'  as const },
  { path: '/sobre',  priority: 0.7, changeFrequency: 'monthly' as const },
  { path: '/contacto', priority: 0.6, changeFrequency: 'monthly' as const },
  { path: '/envios', priority: 0.5, changeFrequency: 'monthly' as const },
  { path: '/privacidade', priority: 0.3, changeFrequency: 'yearly' as const },
  { path: '/termos', priority: 0.3, changeFrequency: 'yearly'  as const },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Páginas estáticas — uma entrada por locale, com alternates hreflang
  const staticEntries: MetadataRoute.Sitemap = staticRoutes.flatMap(({ path, priority, changeFrequency }) =>
    locales.map((locale) => ({
      url: `${BASE_URL}/${locale}${path}`,
      lastModified: now,
      changeFrequency,
      priority,
      alternates: {
        languages: Object.fromEntries(
          locales.map((l) => [l, `${BASE_URL}/${l}${path}`])
        ),
      },
    })),
  );

  // Páginas de produto dinâmicas
  let productEntries: MetadataRoute.Sitemap = [];
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const res = await fetch(`${apiUrl}/products`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const products: { slug: string; updatedAt: string }[] = await res.json();
      productEntries = locales.flatMap((locale) =>
        products.map((p) => ({
          url: `${BASE_URL}/${locale}/loja/${p.slug}`,
          lastModified: new Date(p.updatedAt),
          changeFrequency: 'weekly' as const,
          priority: 0.8,
          alternates: {
            languages: Object.fromEntries(
              locales.map((l) => [l, `${BASE_URL}/${l}/loja/${p.slug}`])
            ),
          },
        })),
      );
    }
  } catch {
    // API indisponível — sem produtos no sitemap
  }

  return [...staticEntries, ...productEntries];
}
