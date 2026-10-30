import { getLocale } from 'next-intl/server';
import { fetchPublicSettings, formatEuro } from '@/lib/settings';

const linkClass = 'text-brand-primary hover:underline';
const h2Class = 'text-xl font-bold text-brand-dark mb-3';

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <a href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>{children}</a>;
}

function TermosPt({ freeShippingThreshold }: { freeShippingThreshold: number }) {
  return (
    <>
      <h1 className="text-4xl font-black text-brand-dark mb-2">Termos e Condições</h1>
      <p className="text-brand-muted mb-10">Última atualização: outubro de 2026</p>

      <div className="space-y-10 text-gray-700 leading-relaxed">

        <section>
          <h2 className={h2Class}>1. Identificação do vendedor</h2>
          <p>
            O site reaxone.com é explorado por Quimera Pragmática, Lda., NIPC 519180976, com sede na Rua Gago Coutinho e Sacadura Cabral, n.º 16, 1.º Esq., 2745-112 Queluz.
            Contacto: <a href="mailto:contact@reaxone.com" className={linkClass}>contact@reaxone.com</a> · <a href="tel:+351928456870" className={linkClass}>+351 928 456 870</a>.
          </p>
        </section>

        <section>
          <h2 className={h2Class}>2. Encomendas</h2>
          <p>Ao realizar uma encomenda, confirma que tem pelo menos 18 anos e que os dados fornecidos são verdadeiros. A encomenda só é confirmada após verificação do pagamento.</p>
        </section>

        <section>
          <h2 className={h2Class}>3. Preços</h2>
          <p>Todos os preços apresentados incluem IVA à taxa legal em vigor. Reservamo-nos o direito de alterar preços sem aviso prévio, sendo sempre aplicado o preço vigente no momento da encomenda.</p>
        </section>

        <section>
          <h2 className={h2Class}>4. Pagamento</h2>
          <p>Aceitamos pagamento por MB Way e transferência bancária. As instruções de pagamento são enviadas por email após a encomenda. A encomenda é cancelada caso o pagamento não seja recebido em 48 horas.</p>
        </section>

        <section>
          <h2 className={h2Class}>5. Entregas</h2>
          <p>As encomendas são processadas em 1 a 2 dias úteis após a confirmação do pagamento e entregues em Portugal Continental em 2 a 4 dias úteis. Os portes têm o custo de 4,93 € (IVA incluído){freeShippingThreshold > 0 && ` e são gratuitos em encomendas a partir de ${formatEuro(freeShippingThreshold, 'pt')}`}. Para entregas nas Regiões Autónomas ou noutros países, contacte-nos antes de encomendar.</p>
        </section>

        <section>
          <h2 className={h2Class}>6. Garantia legal</h2>
          <p>Todos os produtos beneficiam da garantia legal de conformidade de 3 anos a contar da data de entrega, nos termos do Decreto-Lei n.º 84/2021. Em caso de defeito, contacte-nos indicando o número da encomenda e enviando fotografias. Os custos de devolução de produtos com defeito são suportados pela ReaxOne.</p>
        </section>

        <section>
          <h2 className={h2Class}>7. Direito de livre resolução</h2>
          <p>Tem o direito de resolver o contrato no prazo de 14 dias a contar da receção dos produtos, sem necessidade de indicar qualquer motivo (Decreto-Lei n.º 24/2014). Para exercer este direito, envie-nos uma declaração inequívoca por email ou WhatsApp, ou utilize o <a href="#formulario-livre-resolucao" className={linkClass}>formulário de livre resolução</a> disponível nesta página.</p>
          <p className="mt-3">Os custos de devolução são suportados pela ReaxOne. Reembolsamos todos os pagamentos recebidos, incluindo os portes de envio iniciais, no prazo máximo de 14 dias a contar da data em que formos informados da sua decisão, utilizando o mesmo meio de pagamento, salvo acordo em contrário. Podemos reter o reembolso até recebermos os produtos ou até nos ser apresentada prova do seu envio.</p>
          <p className="mt-3">O consumidor é responsável pela depreciação dos produtos que resulte de uma utilização que exceda o necessário para verificar a sua natureza, características e funcionamento.</p>
        </section>

        <section>
          <h2 className={h2Class}>8. Propriedade intelectual</h2>
          <p>Todo o conteúdo deste website (imagens, textos, logótipos) é propriedade da ReaxOne e não pode ser reproduzido sem autorização expressa.</p>
        </section>

        <section>
          <h2 className={h2Class}>9. Resolução de litígios</h2>
          <p>
            Em caso de litígio de consumo, o consumidor pode recorrer ao Centro Nacional de Informação e Arbitragem de Conflitos de Consumo (CNIACC) – <ExternalLink href="https://www.cniacc.pt">www.cniacc.pt</ExternalLink>.
            Mais informações em <ExternalLink href="https://www.consumidor.gov.pt">www.consumidor.gov.pt</ExternalLink>.
            Livro de Reclamações Eletrónico: <ExternalLink href="https://www.livroreclamacoes.pt">www.livroreclamacoes.pt</ExternalLink>.
          </p>
        </section>

        <section>
          <h2 className={h2Class}>10. Lei aplicável</h2>
          <p>Aos presentes termos aplica-se a lei portuguesa.</p>
        </section>

        <section id="formulario-livre-resolucao" className="scroll-mt-24 border border-gray-200 rounded-lg p-6 bg-gray-50">
          <h2 className="text-xl font-bold text-brand-dark mb-1">Formulário de livre resolução</h2>
          <p className="text-sm italic mb-4">(preencha e envie este formulário apenas se quiser resolver o contrato)</p>
          <p className="mb-4">
            Para: Quimera Pragmática, Lda. (ReaxOne), Rua Gago Coutinho e Sacadura Cabral, n.º 16, 1.º Esq., 2745-112 Queluz, <a href="mailto:contact@reaxone.com" className={linkClass}>contact@reaxone.com</a>
          </p>
          <p className="mb-2">Pela presente comunico que resolvo o meu contrato de compra e venda dos seguintes bens:</p>
          <ul className="space-y-2">
            <li>Encomendados em / recebidos em:</li>
            <li>N.º da encomenda:</li>
            <li>Nome do consumidor:</li>
            <li>Morada do consumidor:</li>
            <li>Assinatura (apenas se enviado em papel):</li>
            <li>Data:</li>
          </ul>
        </section>

      </div>
    </>
  );
}

function TermosEn({ freeShippingThreshold }: { freeShippingThreshold: number }) {
  return (
    <>
      <h1 className="text-4xl font-black text-brand-dark mb-2">Terms and Conditions</h1>
      <p className="text-brand-muted mb-10">Last updated: October 2026</p>

      <div className="space-y-10 text-gray-700 leading-relaxed">

        <section>
          <h2 className={h2Class}>1. Seller identification</h2>
          <p>
            The website reaxone.com is operated by Quimera Pragmática, Lda., tax ID (NIPC) 519180976, with registered office at Rua Gago Coutinho e Sacadura Cabral, n.º 16, 1.º Esq., 2745-112 Queluz, Portugal.
            Contact: <a href="mailto:contact@reaxone.com" className={linkClass}>contact@reaxone.com</a> · <a href="tel:+351928456870" className={linkClass}>+351 928 456 870</a>.
          </p>
        </section>

        <section>
          <h2 className={h2Class}>2. Orders</h2>
          <p>By placing an order, you confirm that you are at least 18 years old and that the information provided is accurate. An order is only confirmed once payment has been verified.</p>
        </section>

        <section>
          <h2 className={h2Class}>3. Prices</h2>
          <p>All prices shown include VAT at the applicable legal rate. We reserve the right to change prices without prior notice; the price in force at the time of the order always applies.</p>
        </section>

        <section>
          <h2 className={h2Class}>4. Payment</h2>
          <p>We accept payment by MB Way and bank transfer. Payment instructions are sent by email after the order is placed. The order is cancelled if payment is not received within 48 hours.</p>
        </section>

        <section>
          <h2 className={h2Class}>5. Delivery</h2>
          <p>Orders are processed within 1 to 2 business days after payment confirmation and delivered in mainland Portugal within 2 to 4 business days. Shipping costs €4.93 (VAT included){freeShippingThreshold > 0 && ` and is free on orders of ${formatEuro(freeShippingThreshold, 'en')} or more`}. For deliveries to the Azores, Madeira or other countries, please contact us before ordering.</p>
        </section>

        <section>
          <h2 className={h2Class}>6. Legal guarantee</h2>
          <p>All products are covered by the 3-year legal guarantee of conformity from the date of delivery, under Decree-Law no. 84/2021. In case of a defect, contact us with your order number and photos of the product. The cost of returning defective products is borne by ReaxOne.</p>
        </section>

        <section>
          <h2 className={h2Class}>7. Right of withdrawal</h2>
          <p>You have the right to withdraw from the contract within 14 days of receiving the products, without giving any reason (Decree-Law no. 24/2014). To exercise this right, send us a clear statement by email or WhatsApp, or use the <a href="#withdrawal-form" className={linkClass}>withdrawal form</a> available on this page.</p>
          <p className="mt-3">Return costs are borne by ReaxOne. We will refund all payments received, including the original shipping costs, within 14 days of being informed of your decision, using the same payment method, unless otherwise agreed. We may withhold the refund until we have received the products or you have provided proof of having sent them.</p>
          <p className="mt-3">The consumer is liable for any diminished value of the products resulting from handling beyond what is necessary to establish their nature, characteristics and functioning.</p>
        </section>

        <section>
          <h2 className={h2Class}>8. Intellectual property</h2>
          <p>All content on this website (images, text, logos) is the property of ReaxOne and may not be reproduced without express permission.</p>
        </section>

        <section>
          <h2 className={h2Class}>9. Dispute resolution</h2>
          <p>
            In the event of a consumer dispute, the consumer may refer it to the National Centre for Information and Arbitration of Consumer Disputes (CNIACC) – <ExternalLink href="https://www.cniacc.pt">www.cniacc.pt</ExternalLink>.
            More information at <ExternalLink href="https://www.consumidor.gov.pt">www.consumidor.gov.pt</ExternalLink>.
            Electronic Complaints Book: <ExternalLink href="https://www.livroreclamacoes.pt">www.livroreclamacoes.pt</ExternalLink>.
          </p>
        </section>

        <section>
          <h2 className={h2Class}>10. Applicable law</h2>
          <p>These terms are governed by Portuguese law. In case of any discrepancy between language versions, the Portuguese version prevails.</p>
        </section>

        <section id="withdrawal-form" className="scroll-mt-24 border border-gray-200 rounded-lg p-6 bg-gray-50">
          <h2 className="text-xl font-bold text-brand-dark mb-1">Withdrawal form</h2>
          <p className="text-sm italic mb-4">(complete and return this form only if you wish to withdraw from the contract)</p>
          <p className="mb-4">
            To: Quimera Pragmática, Lda. (ReaxOne), Rua Gago Coutinho e Sacadura Cabral, n.º 16, 1.º Esq., 2745-112 Queluz, Portugal, <a href="mailto:contact@reaxone.com" className={linkClass}>contact@reaxone.com</a>
          </p>
          <p className="mb-2">I hereby give notice that I withdraw from my contract of sale of the following goods:</p>
          <ul className="space-y-2">
            <li>Ordered on / received on:</li>
            <li>Order number:</li>
            <li>Name of consumer:</li>
            <li>Address of consumer:</li>
            <li>Signature (only if this form is sent on paper):</li>
            <li>Date:</li>
          </ul>
        </section>

      </div>
    </>
  );
}

export default async function TermosPage() {
  const locale = await getLocale();
  const { freeShippingThreshold } = await fetchPublicSettings();

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      {locale === 'en'
        ? <TermosEn freeShippingThreshold={freeShippingThreshold} />
        : <TermosPt freeShippingThreshold={freeShippingThreshold} />}
    </div>
  );
}
