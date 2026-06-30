import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Loja',
  description:
    'Bolas de reação, packs de treino e ebooks para atletas de todos os níveis. Envio para Portugal e Europa.',
  openGraph: {
    title: 'Loja | ReaxOne',
    description: 'Equipamento de treino de reação — bolas, packs e ebooks.',
    images: [{ url: '/images/og/og-loja.jpg', width: 1200, height: 630, alt: 'Loja ReaxOne' }],
  },
};

export default function LojaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
