import Image from 'next/image';
import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';

export default async function SobrePage() {
  const locale = await getLocale();
  const prefix = `/${locale}`;
  const t = await getTranslations('about');

  const reactionItems = [
    { label: t('neural_speed'),       desc: t('neural_speed_desc') },
    { label: t('decision_pressure'),  desc: t('decision_pressure_desc') },
    { label: t('stimulus_reading'),   desc: t('stimulus_reading_desc') },
    { label: t('first_step'),         desc: t('first_step_desc') },
  ];

  const modalities = [
    { num: '01', title: t('m01_title'), desc: t('m01_desc') },
    { num: '02', title: t('m02_title'), desc: t('m02_desc') },
    { num: '03', title: t('m03_title'), desc: t('m03_desc') },
    { num: '04', title: t('m04_title'), desc: t('m04_desc') },
    { num: '05', title: t('m05_title'), desc: t('m05_desc'), img: '/images/lifestyle/treino-reacao-criancas.jpg' },
    { num: '06', title: t('m06_title'), desc: t('m06_desc'), img: '/images/lifestyle/treino-reacao-cao.jpg' },
  ];

  const trainingSteps = [
    { num: '01', title: t('t01_title'), desc: t('t01_desc'), icon: '↓' },
    { num: '02', title: t('t02_title'), desc: t('t02_desc'), icon: '↔' },
    { num: '03', title: t('t03_title'), desc: t('t03_desc'), icon: '⚡' },
    { num: '04', title: t('t04_title'), desc: t('t04_desc'), icon: '🎯' },
  ];

  const features = [
    t('feature1'), t('feature2'), t('feature3'), t('feature4'),
  ];

  return (
    <div>

      {/* ── HERO ── */}
      <section className="relative h-[80vh] min-h-[560px] flex items-end overflow-hidden">
        <Image
          src="/images/lifestyle/joao-treino-reacao-indoor-agachamento.jpg"
          alt="ReaxOne — Performance Primeiro"
          fill
          priority
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 pb-16 w-full">
          <span className="inline-block bg-brand-green text-brand-dark text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full mb-6">
            {t('badge')}
          </span>
          <h1 className="text-5xl md:text-7xl font-black text-white leading-none mb-6">
            {t('hero_title').split('\n').map((line, i) => (
              <span key={i}>
                {i === 1 ? <span className="text-brand-green">{line}</span> : line}
                {i < 2 && <br />}
              </span>
            ))}
          </h1>
          <p className="text-gray-300 text-lg md:text-xl max-w-xl leading-relaxed">
            {t('hero_subtitle')}
          </p>
        </div>
      </section>

      {/* ── FILOSOFIA ── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-brand-primary font-bold uppercase tracking-widest text-sm mb-4">
              {t('philosophy_label')}
            </p>
            <h2 className="text-4xl font-black text-brand-dark mb-6 leading-tight">
              {t('philosophy_title').split('\n').map((line, i) => (
                <span key={i}>{line}{i === 0 && <br />}</span>
              ))}
            </h2>
            <p className="text-gray-600 leading-relaxed mb-5">{t('philosophy_p1')}</p>
            <p className="text-gray-600 leading-relaxed">{t('philosophy_p2')}</p>
          </div>
          <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-xl">
            <Image
              src="/images/lifestyle/joao-reacao-exterior-apanhar-chao.jpg"
              alt={t('philosophy_label')}
              fill
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* ── PORQUÊ A REAÇÃO DEFINE O JOGO ── */}
      <section className="bg-brand-light py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="relative aspect-square rounded-2xl overflow-hidden shadow-xl">
              <Image
                src="/images/lifestyle/joao-treino-reacao-indoor-posicao.jpg"
                alt={t('reaction_label')}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <p className="text-brand-primary font-bold uppercase tracking-widest text-sm mb-4">
                {t('reaction_label')}
              </p>
              <h2 className="text-4xl font-black text-brand-dark mb-6 leading-tight">
                {t('reaction_title').split('\n').map((line, i) => (
                  <span key={i}>{line}{i === 0 && <br />}</span>
                ))}
              </h2>
              <p className="text-gray-600 leading-relaxed mb-8">
                {t('reaction_p_before')}
                <strong>{t('reaction_p_bold')}</strong>
                {t('reaction_p_after')}
              </p>
              <div className="space-y-4">
                {reactionItems.map((item) => (
                  <div key={item.label} className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-brand-green mt-2 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-brand-dark">{item.label}</p>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ONDE A REAXONE ATUA ── */}
      <section className="bg-brand-dark text-white py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-brand-green font-bold uppercase tracking-widest text-sm mb-4 text-center">
            {t('modalities_label')}
          </p>
          <h2 className="text-4xl font-black text-center mb-4">
            {t('modalities_title')}
          </h2>
          <p className="text-gray-400 text-center max-w-xl mx-auto mb-14">
            {t('modalities_subtitle')}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {modalities.map((m) => (
              <div key={m.num} className="border border-white/10 rounded-xl overflow-hidden hover:border-brand-green transition-colors">
                {m.img && (
                  <div className="relative h-40 w-full">
                    <Image src={m.img} alt={m.title} fill className="object-cover" />
                  </div>
                )}
                <div className="p-6">
                  <p className="text-brand-green text-xs font-black tracking-widest mb-3">{m.num}</p>
                  <h3 className="text-xl font-black mb-3">{m.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMO TREINAR ── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-brand-primary font-bold uppercase tracking-widest text-sm mb-4 text-center">
            {t('training_label')}
          </p>
          <h2 className="text-4xl font-black text-brand-dark text-center mb-4">
            {t('training_title').split('\n').map((line, i) => (
              <span key={i}>{line}{i === 0 && <br />}</span>
            ))}
          </h2>
          <p className="text-gray-500 text-center max-w-xl mx-auto mb-14">
            {t('training_subtitle')}
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {trainingSteps.map((step) => (
              <div
                key={step.num}
                className="flex gap-5 p-6 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-dark text-brand-green flex items-center justify-center font-black text-xl flex-shrink-0">
                  {step.icon}
                </div>
                <div>
                  <p className="text-xs font-black text-brand-primary uppercase tracking-widest mb-1">{step.num}</p>
                  <h3 className="text-lg font-black text-brand-dark mb-2">{step.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRODUTO EM ACÇÃO ── */}
      <section className="bg-brand-light py-20 px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-brand-primary font-bold uppercase tracking-widest text-sm mb-4">
              {t('products_label')}
            </p>
            <h2 className="text-4xl font-black text-brand-dark mb-6 leading-tight">
              {t('products_title').split('\n').map((line, i) => (
                <span key={i}>{line}{i === 0 && <br />}</span>
              ))}
            </h2>
            <p className="text-gray-600 leading-relaxed mb-6">{t('products_p')}</p>
            <ul className="space-y-3 mb-8">
              {features.map((item) => (
                <li key={item} className="flex items-start gap-3 text-gray-700 text-sm">
                  <span className="text-brand-green font-black mt-0.5 text-base">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <Link href={`${prefix}/loja`} className="btn-primary inline-block">
              {t('view_products')}
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative aspect-square rounded-xl overflow-hidden">
              <Image src="/images/produtos/bola-reacao-verde-splash.jpg" alt="" fill className="object-cover" />
            </div>
            <div className="relative aspect-square rounded-xl overflow-hidden mt-8">
              <Image src="/images/produtos/bola-reacao-branca-splash.jpg" alt="" fill className="object-cover" />
            </div>
            <div className="relative aspect-square rounded-xl overflow-hidden">
              <Image src="/images/produtos/bola-reacao-verde-padel.jpg" alt="" fill className="object-cover" />
            </div>
            <div className="relative aspect-square rounded-xl overflow-hidden mt-8">
              <Image src="/images/produtos/bola-reacao-branca-mao.jpg" alt="" fill className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="relative h-[60vh] min-h-[400px] overflow-hidden">
        <Image
          src="/images/hero/joao-corrida-lateral-bola-verde.jpg"
          alt="ReaxOne"
          fill
          className="object-cover object-top"
        />
        <div className="absolute inset-0 bg-black/65" />
        <div className="absolute inset-0 flex items-center justify-center text-center px-6">
          <div>
            <p className="text-brand-green font-black uppercase tracking-widest text-sm mb-4">
              {t('cta_label')}
            </p>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-8 leading-tight">
              {t('cta_title').split('\n').map((line, i) => (
                <span key={i}>{line}{i === 0 && <br />}</span>
              ))}
            </h2>
            <Link href={`${prefix}/loja`} className="btn-green text-lg px-10 py-4 inline-block">
              {t('cta_btn')}
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
