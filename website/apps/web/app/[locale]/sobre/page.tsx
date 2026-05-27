import Image from 'next/image';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sobre Nós — ReaxOne',
  description: 'Conhece a história da ReaxOne, a marca portuguesa de equipamento desportivo para treino de reação.',
};

export default function SobrePage() {
  const locale = useLocale();
  const prefix = locale === 'en' ? '/en' : '';

  return (
    <div>

      {/* ── HERO ── */}
      <section className="relative h-[70vh] min-h-[500px] flex items-end overflow-hidden">
        <Image
          src="/images/lifestyle/lifestyle-agility-indoor-01.jpg"
          alt="ReaxOne — A nossa história"
          fill
          priority
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 pb-16 w-full">
          <span className="inline-block bg-brand-green text-brand-dark text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
            A nossa história
          </span>
          <h1 className="text-5xl md:text-6xl font-black text-white leading-none">
            Nascemos para<br />mudar a forma<br />de treinar.
          </h1>
        </div>
      </section>

      {/* ── MISSÃO ── */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-brand-primary font-bold uppercase tracking-widest text-sm mb-4">
              A Missão
            </p>
            <h2 className="text-4xl font-black text-brand-dark mb-6">
              React First.<br />Never Performed.
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              A ReaxOne nasceu da convicção de que a reação é a diferença entre ganhar e perder. Desenvolvemos equipamento desportivo que desafia os limites da velocidade de reação, coordenação e agilidade — para atletas que recusam a mediocridade.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Cada produto é pensado e testado em campo por coaches e atletas de alta competição. Porque o detalhe que treinas hoje é a vantagem que tens amanhã.
            </p>
          </div>
          <div className="relative aspect-[3/4] rounded-2xl overflow-hidden">
            <Image
              src="/images/lifestyle/lifestyle-catch-indoor.jpg"
              alt="Treino de reação"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* ── DARK STRIP — VALORES ── */}
      <section className="bg-brand-dark text-white py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-brand-green font-bold uppercase tracking-widest text-sm mb-4 text-center">
            O que nos define
          </p>
          <h2 className="text-4xl font-black text-center mb-16">
            Os nossos valores
          </h2>
          <div className="grid md:grid-cols-3 gap-10">
            {[
              {
                icon: '⚡',
                title: 'Velocidade',
                text: 'Tudo o que fazemos é pensado para melhorar a velocidade de reação — no produto, no treino e na entrega.',
              },
              {
                icon: '🎯',
                title: 'Precisão',
                text: 'Cada detalhe importa. Desde o design das bolas ao peso e textura — cada escolha tem um propósito.',
              },
              {
                icon: '🔥',
                title: 'Intensidade',
                text: 'Trabalhamos com atletas que não se contentam com o suficiente. A ReaxOne é para quem quer mais.',
              },
            ].map((v) => (
              <div key={v.title} className="text-center">
                <div className="text-4xl mb-4">{v.icon}</div>
                <h3 className="text-xl font-bold mb-3 text-brand-green">{v.title}</h3>
                <p className="text-gray-400 leading-relaxed">{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRODUTO EM ACÇÃO ── */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
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
              <Image src="/images/produtos/bola-reacao-branca-mao.jpg" alt="Bola branca" fill className="object-cover" />
            </div>
          </div>
          <div>
            <p className="text-brand-primary font-bold uppercase tracking-widest text-sm mb-4">
              O Produto
            </p>
            <h2 className="text-4xl font-black text-brand-dark mb-6">
              A reaction ball que muda tudo
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              A nossa reaction ball foi desenhada com uma geometria irregular única que torna cada ressalto completamente imprevisível. Ideal para treino de padel, futebol, ténis, basquetebol ou qualquer modalidade que exija reação rápida.
            </p>
            <ul className="space-y-3 mb-8">
              {[
                'Ressalto imprevisível — treina reflexos reais',
                'Borracha premium de alta durabilidade',
                'Disponível em 2 versões: training e competition',
                'Usada por atletas e personal trainers profissionais',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-gray-700">
                  <span className="text-brand-green font-bold mt-0.5">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <Link href={`${prefix}/loja`} className="btn-primary inline-block">
              Ver produtos
            </Link>
          </div>
        </div>
      </section>

      {/* ── LIFESTYLE FULL WIDTH ── */}
      <section className="relative h-[60vh] overflow-hidden">
        <Image
          src="/images/hero/hero-treino-exterior.jpg"
          alt="ReaxOne em ação"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="absolute inset-0 flex items-center justify-center text-center px-6">
          <div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
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
