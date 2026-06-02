import { getLocale } from 'next-intl/server';
import Link from 'next/link';

export default async function EnviosPage() {
  const locale = await getLocale();

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-black text-brand-dark mb-2">Envios e Devoluções</h1>
      <p className="text-brand-muted mb-10">Informação sobre prazos, custos e política de devoluções.</p>

      <div className="space-y-10 text-gray-700 leading-relaxed">

        <section>
          <h2 className="text-xl font-bold text-brand-dark mb-3">Prazo de envio</h2>
          <p>As encomendas são processadas em 1 a 2 dias úteis após confirmação do pagamento. O prazo de entrega é de <strong>2 a 4 dias úteis</strong> para Portugal Continental.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-brand-dark mb-3">Custos de envio</h2>
          <p>O envio é <strong>gratuito</strong> para encomendas acima de <strong>€50</strong>. Para encomendas inferiores, é aplicada uma taxa de <strong>€3,99</strong>.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-brand-dark mb-3">Métodos de pagamento</h2>
          <p>Aceitamos pagamento por <strong>MB Way</strong> e <strong>transferência bancária</strong>. Após a confirmação da encomenda, receberás as instruções de pagamento por email.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-brand-dark mb-3">Devoluções</h2>
          <p>Aceitamos devoluções até <strong>14 dias</strong> após a receção do produto, desde que o artigo esteja em perfeitas condições, sem sinais de uso e na embalagem original.</p>
          <p className="mt-3">Para iniciar uma devolução, contacta-nos por email ou WhatsApp com o número da encomenda.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-brand-dark mb-3">Contacto</h2>
          <p>Para qualquer questão sobre a tua encomenda, fala connosco:</p>
          <ul className="mt-2 space-y-1">
            <li>📧 <a href="mailto:contact@reaxone.com" className="text-brand-primary hover:underline">contact@reaxone.com</a></li>
            <li>📱 <a href="https://wa.me/351911084422" className="text-brand-primary hover:underline">+351 911 084 422</a></li>
          </ul>
        </section>

      </div>

      <div className="mt-12">
        <Link href={`/${locale}/loja`} className="btn-primary inline-block">
          Voltar à loja
        </Link>
      </div>
    </div>
  );
}
