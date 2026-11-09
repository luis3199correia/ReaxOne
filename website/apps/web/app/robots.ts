import { MetadataRoute } from 'next';
import { locales } from '@/i18n/config';
import { localizePath } from '@/i18n/routing';
import { BASE_URL } from '@/lib/seo';

// Rotas internas privadas — bloqueadas nos URLs públicos de todos os idiomas (/pt/conta, /en/account, ...)
const PRIVATE_ROUTES = ['/admin', '/conta', '/auth', '/carrinho', '/checkout', '/coming-soon'];

// `$` e `/` em vez de prefixo solto: `/pt/conta` sozinho também bloquearia `/pt/contacto`
function disallowRules(): string[] {
  const paths = locales.flatMap((l) => PRIVATE_ROUTES.map((r) => localizePath(l, r)));
  return [...new Set(paths)].flatMap((p) => [`${p}$`, `${p}/`]);
}

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: disallowRules() }],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
