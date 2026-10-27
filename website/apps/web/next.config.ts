import createNextIntlPlugin from 'next-intl/plugin';
import { routing } from './i18n/routing';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

// 301 dos URLs antigos (/en/loja, /en/sobre, ...) para os traduzidos (/en/shop, /en/about, ...)
function legacyLocaleRedirects() {
  const toRoute = (p: string) => p.replace(/\[(\w+)\]/g, ':$1');
  return Object.entries(routing.pathnames).flatMap(([internal, localized]) =>
    routing.locales
      .filter((l) => typeof localized !== 'string' && localized[l] !== internal)
      .map((l) => ({
        source: `/${l}${toRoute(internal)}`,
        destination: `/${l}${toRoute((localized as Record<string, string>)[l])}`,
        permanent: true,
      })),
  );
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async redirects() {
    return legacyLocaleRedirects();
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
