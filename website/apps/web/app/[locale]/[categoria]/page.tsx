import { notFound, redirect } from 'next/navigation';
import { localizePath } from '@/i18n/routing';
import type { Locale } from '@/i18n/config';

// Atalho automático para qualquer categoria do backoffice: /pt/tshirts → /pt/loja?categoria=tshirts.
// As rotas fixas (/loja, /sobre, ...) têm prioridade no Next, por isso só chegam aqui
// caminhos desconhecidos. Slug que não seja categoria → 404.
// Os links impressos nos QR codes estão em lib/shortLinks.ts (não dependem desta página).

const CATEGORIES_REVALIDATE_SECONDS = 60;

async function categoryExists(slug: string): Promise<boolean> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  try {
    const res = await fetch(`${apiUrl}/categories`, { next: { revalidate: CATEGORIES_REVALIDATE_SECONDS } });
    if (!res.ok) return false;
    const categories: { slug: string }[] = await res.json();
    return categories.some((c) => c.slug === slug);
  } catch {
    return false;
  }
}

export default async function CategoryShortcut({
  params,
}: {
  params: Promise<{ locale: string; categoria: string }>;
}) {
  const { locale, categoria } = await params;
  const slug = decodeURIComponent(categoria).toLowerCase();
  if (!(await categoryExists(slug))) notFound();
  redirect(`${localizePath(locale as Locale, '/loja')}?categoria=${encodeURIComponent(slug)}`);
}
