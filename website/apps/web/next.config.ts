import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { routing, localizePath } from './i18n/routing';
import { LEGACY_PRODUCT_SLUGS, LEGACY_PATHS } from './lib/legacyRedirects';
import { SHORT_LINKS } from './lib/shortLinks';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

// `permanent: true` daria 308; usamos 301 explícito (o que o Google e os crawlers esperam)
const MOVED_PERMANENTLY = 301 as const;

type Redirect = { source: string; destination: string; statusCode: typeof MOVED_PERMANENTLY };

const redirect = (source: string, destination: string): Redirect => ({
  source,
  destination,
  statusCode: MOVED_PERMANENTLY,
});

// /en/loja, /en/sobre, ... → /en/shop, /en/about, ...
function legacyLocaleRedirects(): Redirect[] {
  const toRoute = (p: string) => p.replace(/\[(\w+)\]/g, ':$1');
  return Object.entries(routing.pathnames).flatMap(([internal, localized]) =>
    routing.locales
      .filter((l) => typeof localized !== 'string' && localized[l] !== internal)
      .map((l) =>
        redirect(`/${l}${toRoute(internal)}`, `/${l}${toRoute((localized as Record<string, string>)[l])}`),
      ),
  );
}

// Slugs de produto que mudaram — direto para o URL final, sem cadeias de redirects
function legacyProductRedirects(): Redirect[] {
  return Object.entries(LEGACY_PRODUCT_SLUGS).flatMap(([oldSlug, newSlug]) =>
    routing.locales.flatMap((l) => {
      const destination = localizePath(l, `/loja/${newSlug}`);
      const sources = new Set([localizePath(l, `/loja/${oldSlug}`), `/${l}/loja/${oldSlug}`]);
      return [...sources].map((source) => redirect(source, destination));
    }),
  );
}

// Links dos QR codes (/bolas, /en/socks, ...) → loja filtrada. Temporário de propósito (307):
// o destino pode mudar sem que os browsers tenham guardado um redirect definitivo.
function shortLinkRedirects() {
  return SHORT_LINKS.flatMap(({ paths, locale, category }) =>
    paths.map((source) => ({
      source,
      destination: `${localizePath(locale, '/loja')}?categoria=${category}`,
      permanent: false,
    })),
  );
}

function legacyPathRedirects(): Redirect[] {
  return Object.entries(LEGACY_PATHS).flatMap(([oldPath, internal]) =>
    routing.locales.map((l) => redirect(`/${l}${oldPath}`, localizePath(l, internal))),
  );
}

const nextConfig: NextConfig = {
  output: 'standalone',
  async redirects() {
    // Os mais específicos primeiro: o Next aplica o primeiro que coincidir
    return [
      ...shortLinkRedirects(),
      ...legacyProductRedirects(),
      ...legacyPathRedirects(),
      ...legacyLocaleRedirects(),
    ];
  },
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default withNextIntl(nextConfig);
