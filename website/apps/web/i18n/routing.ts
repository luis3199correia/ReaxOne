import { defineRouting } from 'next-intl/routing';
import { locales, defaultLocale, type Locale } from './config';

// Rotas internas (pastas em app/[locale], em PT) → URL público por idioma
export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'always',
  pathnames: {
    '/': '/',
    '/loja': { pt: '/loja', en: '/shop' },
    '/loja/[slug]': { pt: '/loja/[slug]', en: '/shop/[slug]' },
    '/sobre': { pt: '/sobre', en: '/about' },
    '/contacto': { pt: '/contacto', en: '/contact' },
    '/envios': { pt: '/envios', en: '/shipping' },
    '/privacidade': { pt: '/privacidade', en: '/privacy' },
    '/termos': { pt: '/termos', en: '/terms' },
    '/carrinho': { pt: '/carrinho', en: '/cart' },
    '/checkout': '/checkout',
    '/checkout/confirmacao': { pt: '/checkout/confirmacao', en: '/checkout/confirmation' },
    '/conta': { pt: '/conta', en: '/account' },
    '/conta/perfil': { pt: '/conta/perfil', en: '/account/profile' },
    '/auth': '/auth',
    '/auth/reset': '/auth/reset',
    '/coming-soon': '/coming-soon',
    '/admin': '/admin',
    '/admin/produtos': { pt: '/admin/produtos', en: '/admin/products' },
    '/admin/categorias': { pt: '/admin/categorias', en: '/admin/categories' },
    '/admin/encomendas': { pt: '/admin/encomendas', en: '/admin/orders' },
    '/admin/clientes': { pt: '/admin/clientes', en: '/admin/customers' },
    '/admin/configuracoes': { pt: '/admin/configuracoes', en: '/admin/settings' },
  },
});

export type AppPathname = keyof typeof routing.pathnames;
// Rotas sem parâmetros dinâmicos (podem ser usadas diretamente como href)
export type StaticPathname = Exclude<AppPathname, `${string}[${string}`>;

// URL público (com prefixo de locale) para uma rota interna, ex: ('en', '/loja/bola') → '/en/shop/bola'
export function localizePath(locale: Locale, internalPath: string): string {
  for (const [internal, localized] of Object.entries(routing.pathnames)) {
    const target = typeof localized === 'string' ? localized : localized[locale];
    const pattern = new RegExp('^' + internal.replace(/\[[^\]]+\]/g, '([^/]+)') + '$');
    const match = internalPath.match(pattern);
    if (!match) continue;
    let i = 1;
    const path = target.replace(/\[[^\]]+\]/g, () => match[i++]);
    return `/${locale}${path === '/' ? '' : path}`;
  }
  return `/${locale}${internalPath === '/' ? '' : internalPath}`;
}
