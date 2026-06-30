import { Metadata } from 'next';
import { getTranslations, getLocale } from 'next-intl/server';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'ReaxOne — Treino de Reação',
  description:
    'Bolas de reação, packs de treino e ebooks para atletas de todos os níveis. Treina mais rápido, reage melhor. Envio para Portugal e Europa.',
  openGraph: {
    title: 'ReaxOne — Treino de Reação',
    description: 'Equipamento de treino de reação para atletas de todos os níveis.',
    images: [{ url: '/images/og/og-default.jpg', width: 1200, height: 630, alt: 'ReaxOne' }],
  },
};

export default async function HomePage() {
  const t = await getTranslations('home');
  const tp = await getTranslations('products');
  const locale = await getLocale();
  const prefix = `/${locale}`;

  // Buscar produtos marcados como destaque no backoffice
  type ApiProduct = { id: string; slug: string; name: string; price: number; images: string[] };
  let featuredProducts: { id: string; name: string; price: number; image: string; tag: string | null }[] = [];
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const res = await fetch(`${apiUrl}/products?featured=true`, { next: { revalidate: 60 } });
    if (res.ok) {
      const list: ApiProduct[] = await res.json();
      featuredProducts = list.map((p) => ({
        id: p.slug,  // slug usado como link /loja/[slug]
        name: p.name,
        price: p.price,
        image: p.images?.[0] || '/images/produtos/placeholder.jpg',
        tag: null,
      }));
    }
  } catch {
    // API indisponível — secção fica vazia
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'ReaxOne',
    url: 'https://reaxone.com',
    logo: 'https://reaxone.com/images/identidade/texto-branco.svg',
    sameAs: ['https://www.instagram.com/reax.one/'],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+351-911-084-422',
      contactType: 'customer service',
      availableLanguage: ['Portuguese', 'English'],
    },
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── HERO ── */}
      <section className="relative h-[90vh] min-h-[600px] flex items-center overflow-hidden">
        <Image
          src="/images/hero/joao-bola-verde-closeup-mao.jpg"
          alt="ReaxOne — Treino de reação"
          fill
          priority
          className="object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
          <div className="max-w-2xl">
            {/* Slogan SVG */}
            <div className="mb-6">
              <Image
                src="/images/identidade/precision.svg"
                alt="Precision starts before the match"
                width={480}
                height={60}
                className="object-contain"
              />
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white leading-none mb-6">
              {t('hero_title')}
            </h1>
            <p className="text-lg text-gray-300 mb-10 leading-relaxed max-w-lg">
              {t('hero_subtitle')}
            </p>
            <div className="flex gap-4 flex-wrap">
              <Link href={`${prefix}/loja`} className="btn-primary text-lg px-8 py-4">
                {t('shop_now')}
              </Link>
              <Link href={`${prefix}/sobre`} className="btn-secondary text-lg px-8 py-4 border-white text-white hover:bg-white hover:text-brand-dark">
                {t('about_us')}
              </Link>
            </div>
          </div>
        </div>

        {/* Tubarão decorativo */}
        <div className="absolute bottom-0 right-0 w-64 md:w-96 opacity-10 pointer-events-none select-none">
          <Image
            src="/images/identidade/tubarao-branco.svg"
            alt=""
            width={600}
            height={450}
            className="object-contain"
          />
        </div>
      </section>

      {/* ── STRIP DE CONFIANÇA ── */}
      <section className="bg-brand-green text-brand-dark py-4">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-center gap-8 text-sm font-bold uppercase tracking-wider">
          <span>⚡ {t('trust_shipping')}</span>
          <span>🦈 {t('trust_tech')}</span>
          <span>🇵🇹 {t('trust_athletes')}</span>
          <span>🎯 {t('trust_motto')}</span>
        </div>
      </section>

      {/* ── FEATURED PRODUCTS ── */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-brand-primary font-bold uppercase tracking-widest text-sm mb-2">
              {t('equipment_label')}
            </p>
            <h2 className="text-4xl font-black text-brand-dark">
              {t('featured_products')}
            </h2>
          </div>
          <Link
            href={`${prefix}/loja`}
            className="text-sm font-semibold text-brand-primary hover:underline hidden md:block"
          >
            {t('see_all')}
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {featuredProducts.map((product) => (
            <Link
              key={product.id}
              href={`${prefix}/loja/${product.id}`}
              className="group card hover:shadow-lg transition-shadow duration-300"
            >
              <div className="relative aspect-square overflow-hidden bg-brand-dark">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {product.tag && (
                  <span className="absolute top-3 left-3 bg-brand-green text-brand-dark text-xs font-bold px-2 py-1 rounded">
                    {product.tag}
                  </span>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-sm text-brand-dark leading-snug mb-1">
                  {product.name}
                </h3>
                <p className="text-brand-primary font-bold">€{product.price.toFixed(2)}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── ATTACK THE MOMENT ── */}
      <section className="bg-brand-dark py-20 px-6 overflow-hidden relative">
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <Image src="/images/identidade/tubarao-branco.svg" alt="" fill className="object-contain object-right" />
        </div>
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <Image
            src="/images/identidade/attack-branco.svg"
            alt="Attack the moment"
            width={700}
            height={120}
            className="object-contain mx-auto mb-8"
          />
          <p className="text-gray-400 text-lg max-w-xl mx-auto leading-relaxed">
            {t('attack_desc')}
          </p>
        </div>
      </section>

      {/* ── LIFESTYLE SPLIT ── */}
      <section className="grid md:grid-cols-2 min-h-[500px]">
        <div className="relative min-h-[400px]">
          <Image
            src="/images/hero/joao-corrida-exterior-bola-verde.jpg"
            alt="Treino exterior com ReaxOne"
            fill
            className="object-cover"
          />
        </div>
        <div className="bg-brand-gray text-white flex items-center p-12 md:p-16">
          <div>
            <div className="mb-6">
              <Image
                src="/images/identidade/react.svg"
                alt="React first. Win more."
                width={360}
                height={80}
                className="object-contain"
              />
            </div>
            <p className="text-gray-400 mb-8 leading-relaxed">
              {t('lifestyle_desc')}
            </p>
            <Link href={`${prefix}/sobre`} className="btn-green inline-block">
              {t('know_brand')}
            </Link>
          </div>
        </div>
      </section>

      {/* ── LIFESTYLE GRID ── */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-brand-primary font-bold uppercase tracking-widest text-sm mb-2">
            {t('community_label')}
          </p>
          <h2 className="text-4xl font-black text-brand-dark">
            React First. Always.
          </h2>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            '/images/lifestyle/joao-reacao-exterior-bola-ressalto-pes.jpg',
            '/images/lifestyle/joao-reacao-exterior-bola-ar-frente.jpg',
            '/images/lifestyle/joao-reacao-exterior-agachar-bola.jpg',
            '/images/lifestyle/joao-reacao-exterior-posicao-lateral.jpg',
            '/images/lifestyle/treino-reacao-criancas.jpg',
            '/images/lifestyle/treino-reacao-cao.jpg',
          ].map((src, i) => (
            <div key={i} className="relative aspect-square overflow-hidden rounded-lg">
              <Image
                src={src}
                alt={t('lifestyle_alt')}
                fill
                className="object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
