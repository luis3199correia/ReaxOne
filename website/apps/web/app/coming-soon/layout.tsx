import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { GoogleTagHead, GoogleTagNoScript } from '@/components/analytics/GoogleTag';
import '../globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ReaxOne — Em Breve',
  description: 'Algo grande está a chegar. Performance Primeiro. Sempre.',
};

export default function ComingSoonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt">
      <head>
        <GoogleTagHead />
      </head>
      <body className={inter.className}>
        <GoogleTagNoScript />
        {children}
      </body>
    </html>
  );
}
