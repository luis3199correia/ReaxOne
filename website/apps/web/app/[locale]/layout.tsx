import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n/config';
import ConditionalShell from '@/components/layout/ConditionalShell';
import '../globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://reaxone.com'),
  title: {
    default: 'ReaxOne — Treino de Reação',
    template: '%s | ReaxOne',
  },
  description:
    'Equipamento de treino de reação para atletas de todos os níveis. Bolas de reação, packs de treino e ebooks. Envio para Portugal e Europa.',
  keywords: [
    'bola de reação', 'treino de reação', 'reaction ball', 'equipamento desportivo',
    'treino funcional', 'desporto portugal', 'reaxone',
  ],
  authors: [{ name: 'ReaxOne', url: 'https://reaxone.com' }],
  creator: 'ReaxOne',
  openGraph: {
    type: 'website',
    locale: 'pt_PT',
    alternateLocale: 'en_US',
    siteName: 'ReaxOne',
    title: 'ReaxOne — Treino de Reação',
    description:
      'Equipamento de treino de reação para atletas de todos os níveis. Bolas de reação, packs e ebooks.',
    images: [
      {
        url: '/images/og/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'ReaxOne — Treino de Reação',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ReaxOne — Treino de Reação',
    description: 'Equipamento de treino de reação para atletas de todos os níveis.',
    images: ['/images/og/og-default.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!locales.includes(locale as any)) notFound();

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages}>
          <ConditionalShell>{children}</ConditionalShell>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
