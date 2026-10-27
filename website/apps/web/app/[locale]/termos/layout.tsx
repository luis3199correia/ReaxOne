import type { Metadata } from 'next';
import { localeAlternates } from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { alternates: localeAlternates(locale, '/termos') };
}

export default function TermosLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
