import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/*/admin', '/*/conta', '/*/carrinho', '/*/checkout'],
      },
    ],
    sitemap: 'https://reaxone.com/sitemap.xml',
  };
}
