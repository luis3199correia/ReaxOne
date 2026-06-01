import { getTranslations, getLocale } from 'next-intl/server';
import Image from 'next/image';
import Link from 'next/link';

const featuredProducts = [
  {
    id: 'bola-reacao-verde',
    name: 'Bola de Reação Verde',
    price: 14.99,
    image: '/images/produtos/bola-reacao-verde-splash.jpg',
    tag: 'Bestseller',
  },
  {
    id: 'bola-reacao-branca',
    name: 'Bola de Reação Branca',
    price: 14.99,
    image: '/images/produtos/bola-reacao-branca-splash.jpg',
    tag: 'Novo',
  },
  {
    id: 'bola-reacao-verde-padel',
    name: 'Bola de Reação — Padel',
    price: 14.99,
    image: '/images/produtos/bola-reacao-verde-padel.jpg',
    tag: null,
  },
  {
    id: 'bola-reacao-branca-pack',
    name: 'Pack Duplo Branco',
    price: 24.99,
    image: '/images/produtos/bola-reacao-branca-mao.jpg',
    tag: 'Pack',
  },
];

export default async function HomePage() {
  const t = await getTranslations('home');
  const locale = await getLocale();
  const prefix = `/${locale}`;

  return (
    <div>

      {/* ── HERO ── */}
      <section className="relative h-[90vh] min-h-[600px] flex items-center overflow-hidden">
        <Image
          src="/images/hero/hero-react-first-indoor.jpg"
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
                Sobre nós
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
          <span>⚡ Envio em 24h</span>
          <span>🦈 Tecnologia exclusiva</span>
          <span>🇵🇹 Feito para atletas</span>
          <span>🎯 React First. Win More.</span>
        </div>
      </section>

      {/* ── FEATURED PRODUCTS ── */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-brand-primary font-bold uppercase tracking-widest text-sm mb-2">
              Equipamento
            </p>
            <h2 className="text-4xl font-black text-brand-dark">
              {t('featured_products')}
            </h2>
          </div>
          <Link
            href={`${prefix}/loja`}
            className="text-sm font-semibold text-brand-primary hover:underline hidden md:block"
          >
            Ver todos →
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
            A reação define o jogo antes do contacto com a bola. Treina o imprevisível. Domina o momento.
          </p>
        </div>
      </section>

      {/* ── LIFESTYLE SPLIT ── */}
      <section className="grid md:grid-cols-2 min-h-[500px]">
        <div className="relative min-h-[400px]">
          <Image
            src="/images/hero/hero-treino-exterior.jpg"
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
              As reaction balls ReaxOne foram desenvolvidas para treinar velocidade de reação, agilidade e coordenação. Usadas por atletas profissionais e personal trainers em padel, futebol, ténis e formação desportiva.
            </p>
            <Link href={`${prefix}/sobre`} className="btn-green inline-block">
              Conhecer a marca
            </Link>
          </div>
        </div>
      </section>

      {/* ── LIFESTYLE GRID ── */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-brand-primary font-bold uppercase tracking-widest text-sm mb-2">
            Comunidade
          </p>
          <h2 className="text-4xl font-black text-brand-dark">
            React First. Always.
          </h2>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            '/images/lifestyle/lifestyle-agility-indoor-01.jpg',
            '/images/lifestyle/lifestyle-catch-indoor.jpg',
            '/images/lifestyle/lifestyle-agility-indoor-02.jpg',
            '/images/lifestyle/lifestyle-pickup-exterior.jpg',
            '/images/lifestyle/lifestyle-hold-exterior.jpg',
            '/images/produtos/bola-reacao-verde-padel.jpg',
          ].map((src, i) => (
            <div key={i} className="relative aspect-square overflow-hidden rounded-lg">
              <Image
                src={src}
                alt="ReaxOne lifestyle"
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
