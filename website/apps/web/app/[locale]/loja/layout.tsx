import { Metadata } from 'next';
import { localeAlternates } from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isPt = locale === 'pt';
  return {
    title: isPt ? 'Loja' : 'Shop',
    description: isPt
      ? 'Bolas de reação, packs de treino e meias para atletas de todos os níveis. Envio para Portugal e Europa.'
      : 'Reaction balls, training packs and socks for athletes of all levels. Shipping to Portugal and Europe.',
    alternates: localeAlternates(locale, '/loja'),
    openGraph: {
      title: isPt ? 'Loja | ReaxOne' : 'Shop | ReaxOne',
      description: isPt
        ? 'Equipamento de treino de reação — bolas, packs e meias.'
        : 'Reaction training equipment — balls, packs and socks.',
      images: [{ url: '/images/og/og-loja.jpg', width: 1200, height: 630, alt: isPt ? 'Loja ReaxOne' : 'ReaxOne Shop' }],
    },
  };
}

export default function LojaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
