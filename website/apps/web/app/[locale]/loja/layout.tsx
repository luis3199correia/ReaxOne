import { Metadata } from 'next';
import { localeAlternates } from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: 'Loja',
    description:
      'Bolas de reação, packs de treino e ebooks para atletas de todos os níveis. Envio para Portugal e Europa.',
    alternates: localeAlternates(locale, '/loja'),
    openGraph: {
      title: 'Loja | ReaxOne',
      description: 'Equipamento de treino de reação — bolas, packs e ebooks.',
      images: [{ url: '/images/og/og-loja.jpg', width: 1200, height: 630, alt: 'Loja ReaxOne' }],
    },
  };
}

export default function LojaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
