import { MetadataRoute } from 'next';

const BASE_URL = 'https://reaxone.com';

const staticRoutes = [
  '',
  '/loja',
  '/sobre',
  '/contacto',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const locales = ['pt', 'en'];

  // Páginas estáticas
  const staticEntries: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    staticRoutes.map((route) => ({
      url: `${BASE_URL}/${locale}${route}`,
      lastModified: new Date(),
      changeFrequency: route === '' ? 'weekly' : 'monthly',
      priority: route === '' ? 1.0 : route === '/loja' ? 0.9 : 0.7,
    })),
  );

  // Páginas de produto dinâmicas
  let productEntries: MetadataRoute.Sitemap = [];
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const res = await fetch(`${apiUrl}/products`);
    if (res.ok) {
      const products: { slug: string; updatedAt: string }[] = await res.json();
      productEntries = locales.flatMap((locale) =>
        products.map((p) => ({
          url: `${BASE_URL}/${locale}/loja/${p.slug}`,
          lastModified: new Date(p.updatedAt),
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        })),
      );
    }
  } catch {
    // API indisponível durante build — sem produtos no sitemap
  }

  return [...staticEntries, ...productEntries];
}
