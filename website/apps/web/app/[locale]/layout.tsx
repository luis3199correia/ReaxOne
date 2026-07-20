import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n/config';
import ConditionalShell from '@/components/layout/ConditionalShell';
import '../globals.css';

const inter = Inter({ subsets: ['latin'] });

const BASE_URL = 'https://reaxone.com';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isPt = locale === 'pt';

  return {
    metadataBase: new URL(BASE_URL),
    title: {
      default: isPt ? 'ReaxOne — Treino de Reação' : 'ReaxOne — Reaction Training',
      template: '%s | ReaxOne',
    },
    description: isPt
      ? 'Equipamento de treino de reação para atletas de todos os níveis. Bolas de reação, packs de treino e ebooks. Envio para Portugal e Europa.'
      : 'Reaction training equipment for athletes of all levels. Reaction balls, training packs and ebooks. Shipping to Portugal and Europe.',
    keywords: [
      'bola de reação', 'treino de reação', 'reaction ball', 'equipamento desportivo',
      'treino funcional', 'desporto portugal', 'reaxone',
    ],
    authors: [{ name: 'ReaxOne', url: BASE_URL }],
    creator: 'ReaxOne',
    alternates: {
      canonical: `${BASE_URL}/${locale}`,
      languages: {
        'pt': `${BASE_URL}/pt`,
        'en': `${BASE_URL}/en`,
        'x-default': `${BASE_URL}/pt`,
      },
    },
    openGraph: {
      type: 'website',
      locale: isPt ? 'pt_PT' : 'en_US',
      alternateLocale: isPt ? 'en_US' : 'pt_PT',
      siteName: 'ReaxOne',
      title: isPt ? 'ReaxOne — Treino de Reação' : 'ReaxOne — Reaction Training',
      description: isPt
        ? 'Equipamento de treino de reação para atletas de todos os níveis. Bolas de reação, packs e ebooks.'
        : 'Reaction training equipment for athletes of all levels. Reaction balls, packs and ebooks.',
      images: [
        {
          url: '/images/og/og-default.jpg',
          width: 1200,
          height: 630,
          alt: 'ReaxOne',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: isPt ? 'ReaxOne — Treino de Reação' : 'ReaxOne — Reaction Training',
      description: isPt
        ? 'Equipamento de treino de reação para atletas de todos os níveis.'
        : 'Reaction training equipment for athletes of all levels.',
      images: ['/images/og/og-default.jpg'],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    },
  };
}

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
