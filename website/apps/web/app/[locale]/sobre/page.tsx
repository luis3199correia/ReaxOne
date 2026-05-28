import Image from 'next/image';
import Link from 'next/link';
import { getLocale } from 'next-intl/server';

export default async function SobrePage() {
  const locale = await getLocale();
  const prefix = `/${locale}`;

  return (
    <div>

      {/* ── HERO ── */}
      <section className="relative h-[80vh] min-h-[560px] flex items-end overflow-hidden">
        <Image
          src="/images/lifestyle/lifestyle-agility-indoor-01.jpg"
          alt="ReaxOne — Performance Primeiro"
          fill
          priority
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 pb-16 w-full">
          <span className="inline-block bg-brand-green text-brand-dark text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full mb-6">
            A marca
          </span>
          <h1 className="text-5xl md:text-7xl font-black text-white leading-none mb-6">
            Performance<br />
            <span className="text-brand-green">Primeiro.</span><br />
            Sempre.
          </h1>
          <p className="text-gray-300 text-lg md:text-xl max-w-xl leading-relaxed">
            A ReaxOne nasce da preparação física aplicada ao jogo real.
          </p>
        </div>
      </section>

      {/* ── FILOSOFIA ── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-brand-primary font-bold uppercase tracking-widest text-sm mb-4">
              A nossa filosofia
            </p>
            <h2 className="text-4xl font-black text-brand-dark mb-6 leading-tight">
              Não é repetição.<br />É adaptação.
            </h2>
            <p className="text-gray-600 leading-relaxed mb-5">
              Cada produto é desenhado para desenvolver reação, tomada de decisão e transferência direta para a competição — não apenas repetição mecânica.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Trabalhamos com atletas, treinadores e clubes que exigem método, precisão e propósito em cada estímulo.
            </p>
          </div>
          <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-xl">
            <Image
              src="/images/lifestyle/lifestyle-catch-indoor.jpg"
              alt="Treino de reação"
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
                src="/images/lifestyle/lifestyle-agility-indoor-02.jpg"
                alt="Velocidade de reação"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <p className="text-brand-primary font-bold uppercase tracking-widest text-sm mb-4">
                Porque a reação define o jogo
              </p>
              <h2 className="text-4xl font-black text-brand-dark mb-6 leading-tight">
                Quem reage primeiro,<br />decide melhor.
              </h2>
              <p className="text-gray-600 leading-relaxed mb-8">
                A maioria das ações decisivas acontece <strong>antes do contacto com a bola</strong>. A reação determina a performance antes de a ação acontecer.
              </p>
              <div className="space-y-4">
                {[
                  { label: 'Velocidade neural', desc: 'Treina o sistema nervoso para responder mais rápido.' },
                  { label: 'Tomada de decisão sob pressão', desc: 'Simula cenários reais de competição.' },
                  { label: 'Leitura do estímulo real', desc: 'Não reages ao que esperas — reages ao que acontece.' },
                  { label: 'Eficiência do primeiro passo', desc: 'O passo certo no momento certo faz toda a diferença.' },
                ].map((item) => (
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
            Modalidades
          </p>
          <h2 className="text-4xl font-black text-center mb-4">
            Onde a ReaxOne atua
          </h2>
          <p className="text-gray-400 text-center max-w-xl mx-auto mb-14">
            A bola de reação adapta-se a qualquer modalidade que exija velocidade, leitura e decisão.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              {
                num: '01',
                title: 'Padel',
                desc: 'Reação, posicionamento e eficiência do split-step em rallies imprevisíveis.',
              },
              {
                num: '02',
                title: 'Ténis',
                desc: 'Ler o ressalto. Reagir antes do golpe do adversário.',
              },
              {
                num: '03',
                title: 'Futebol',
                desc: 'Primeiro passo, perceção e tomada de decisão sob pressão.',
              },
              {
                num: '04',
                title: 'Formação',
                desc: 'Construir bases neurais para hábitos fortes desde cedo.',
              },
            ].map((m) => (
              <div key={m.num} className="border border-white/10 rounded-xl p-6 hover:border-brand-green transition-colors">
                <p className="text-brand-green text-xs font-black tracking-widest mb-3">{m.num}</p>
                <h3 className="text-xl font-black mb-3">{m.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMO TREINAR ── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-brand-primary font-bold uppercase tracking-widest text-sm mb-4 text-center">
            Guia de treino
          </p>
          <h2 className="text-4xl font-black text-brand-dark text-center mb-4">
            Como treinar com a<br />bola de reação
          </h2>
          <p className="text-gray-500 text-center max-w-xl mx-auto mb-14">
            Quatro formas de integrar a ReaxOne no teu treino e extrair o máximo da tua velocidade de resposta.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                num: '01',
                title: 'Queda imprevisível',
                desc: 'Larga a bola a diferentes alturas e reage ao primeiro ressalto. Começa devagar e aumenta a velocidade progressivamente.',
                icon: '↓',
              },
              {
                num: '02',
                title: 'Reação com parceiro',
                desc: 'Um parceiro lança a bola sem aviso. Foco na leitura e no primeiro passo. Nível de dificuldade máximo.',
                icon: '↔',
              },
              {
                num: '03',
                title: 'Decisão sob pressão',
                desc: 'Adiciona um estímulo visual ou verbal antes da queda. Treina o processamento de informação sob stress competitivo.',
                icon: '⚡',
              },
              {
                num: '04',
                title: 'Transferência para o jogo',
                desc: 'Integra no aquecimento técnico — padel, ténis, futebol. Ligação direta entre o estímulo de treino e o gesto desportivo real.',
                icon: '🎯',
              },
            ].map((step) => (
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
              Os nossos produtos
            </p>
            <h2 className="text-4xl font-black text-brand-dark mb-6 leading-tight">
              A reaction ball que<br />muda o treino
            </h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              Geometria irregular única que torna cada ressalto completamente imprevisível. Usada por atletas e treinadores de alta competição em padel, futebol, ténis e formação desportiva.
            </p>
            <ul className="space-y-3 mb-8">
              {[
                'Ressalto imprevisível — treina reflexos reais',
                'Borracha premium de alta durabilidade',
                'Indoor e outdoor',
                'Ideal para todas as modalidades',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-gray-700 text-sm">
                  <span className="text-brand-green font-black mt-0.5 text-base">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <Link href={`${prefix}/loja`} className="btn-primary inline-block">
              Ver produtos
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative aspect-square rounded-xl overflow-hidden">
              <Image src="/images/produtos/bola-reacao-verde-splash.jpg" alt="Bola de reação verde" fill className="object-cover" />
            </div>
            <div className="relative aspect-square rounded-xl overflow-hidden mt-8">
              <Image src="/images/produtos/bola-reacao-branca-splash.jpg" alt="Bola de reação branca" fill className="object-cover" />
            </div>
            <div className="relative aspect-square rounded-xl overflow-hidden">
              <Image src="/images/produtos/bola-reacao-verde-padel.jpg" alt="Padel" fill className="object-cover" />
            </div>
            <div className="relative aspect-square rounded-xl overflow-hidden mt-8">
              <Image src="/images/produtos/bola-reacao-branca-mao.jpg" alt="Bola branca em mão" fill className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="relative h-[60vh] min-h-[400px] overflow-hidden">
        <Image
          src="/images/hero/hero-treino-exterior.jpg"
          alt="ReaxOne em ação"
          fill
          className="object-cover object-top"
        />
        <div className="absolute inset-0 bg-black/65" />
        <div className="absolute inset-0 flex items-center justify-center text-center px-6">
          <div>
            <p className="text-brand-green font-black uppercase tracking-widest text-sm mb-4">
              Performance primeiro. Sempre.
            </p>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-8 leading-tight">
              Pronto para reagir<br />mais rápido?
            </h2>
            <Link href={`${prefix}/loja`} className="btn-green text-lg px-10 py-4 inline-block">
              Comprar agora
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
