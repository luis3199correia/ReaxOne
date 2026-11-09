'use client';

import { Suspense } from 'react';
import { useLocale } from 'next-intl';
import { useParams, useSearchParams } from 'next/navigation';
import { Link, usePathname } from '@/i18n/navigation';

const CLASS_NAME = 'text-xs text-gray-500 hover:text-white uppercase tracking-widest transition-colors';

// Mantém a página atual, com o URL traduzido do outro idioma
function SwitcherLink({ query }: { query?: Record<string, string> }) {
  const locale = useLocale();
  const pathname = usePathname();
  const params = useParams();
  return (
    <Link
      // pathname é a rota interna (ex: '/loja/[slug]') e params traz o slug
      // @ts-expect-error -- combinação pathname/params resolvida em runtime
      href={{ pathname, params, query }}
      locale={locale === 'pt' ? 'en' : 'pt'}
      className={CLASS_NAME}
    >
      {locale === 'pt' ? 'EN' : 'PT'}
    </Link>
  );
}

// Inclui a querystring (ex: ?categoria=bolas) para não perder o filtro ao trocar de idioma
function SwitcherWithQuery() {
  const searchParams = useSearchParams();
  const query = Object.fromEntries(searchParams.entries());
  return <SwitcherLink query={Object.keys(query).length ? query : undefined} />;
}

// useSearchParams obriga a um Suspense; sem ele, todas as páginas estáticas passariam a
// renderizar só no cliente. O fallback (sem query) só aparece durante a pré-renderização.
export default function LocaleSwitcher() {
  return (
    <Suspense fallback={<SwitcherLink />}>
      <SwitcherWithQuery />
    </Suspense>
  );
}
