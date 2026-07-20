import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/*/admin',
          '/*/admin/*',
          '/*/conta',
          '/*/conta/*',
          '/*/auth',
          '/*/auth/*',
          '/*/carrinho',
          '/*/checkout',
          '/*/checkout/*',
          '/*/coming-soon',
        ],
      },
    ],
    sitemap: 'https://reaxone.com/sitemap.xml',
  };
}
