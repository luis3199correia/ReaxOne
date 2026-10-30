import { getLocale } from 'next-intl/server';

const linkClass = 'text-brand-primary hover:underline';
const h2Class = 'text-xl font-bold text-brand-dark mb-3';

const emailLink = <a href="mailto:contact@reaxone.com" className={linkClass}>contact@reaxone.com</a>;
const cnpdLink = <a href="https://www.cnpd.pt" target="_blank" rel="noopener noreferrer" className={linkClass}>www.cnpd.pt</a>;

function PrivacidadePt() {
  return (
    <>
      <h1 className="text-4xl font-black text-brand-dark mb-2">Política de Privacidade</h1>
      <p className="text-brand-muted mb-10">Última atualização: outubro de 2026</p>

      <div className="space-y-10 text-gray-700 leading-relaxed">

        <section>
          <h2 className={h2Class}>Responsável pelo tratamento</h2>
          <p>
            Quimera Pragmática, Lda. (ReaxOne), NIPC 519180976, com sede na Rua Gago Coutinho e Sacadura Cabral, n.º 16, 1.º Esq., 2745-112 Queluz.
            Contacto para questões de privacidade: {emailLink}.
          </p>
        </section>

        <section>
          <h2 className={h2Class}>Dados que recolhemos</h2>
          <p>Nome, email, telefone, morada de entrega e de faturação, NIF (quando pede fatura com contribuinte) e histórico de encomendas. Não recolhemos nem guardamos dados de cartões de pagamento.</p>
        </section>

        <section>
          <h2 className={h2Class}>Para que usamos os dados e com que fundamento</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Processar, enviar e acompanhar as encomendas – execução do contrato.</li>
            <li>Emitir faturas e cumprir obrigações fiscais – obrigação legal.</li>
            <li>Responder aos seus pedidos de contacto – diligências a seu pedido e interesse legítimo.</li>
          </ul>
        </section>

        <section>
          <h2 className={h2Class}>Com quem partilhamos</h2>
          <p>Apenas com prestadores necessários ao serviço: transportadora (Batch), alojamento do site (Hetzner) e software de faturação (Weoinvoice). Não vendemos nem cedemos dados para fins comerciais.</p>
        </section>

        <section>
          <h2 className={h2Class}>Durante quanto tempo</h2>
          <p>Os dados de encomendas e faturas são conservados durante 10 anos, por obrigação fiscal. Os restantes dados são apagados quando deixam de ser necessários.</p>
        </section>

        <section>
          <h2 className={h2Class}>Os seus direitos</h2>
          <p>
            Pode pedir o acesso, a retificação, o apagamento, a limitação, a portabilidade dos seus dados ou opor-se ao seu tratamento, através de {emailLink}.
            Respondemos no prazo máximo de um mês. Tem ainda o direito de apresentar reclamação à Comissão Nacional de Proteção de Dados ({cnpdLink}).
          </p>
        </section>

        <section>
          <h2 className={h2Class}>Cookies</h2>
          <p>Utilizamos apenas cookies essenciais ao funcionamento do site (por exemplo, sessão de login). Não usamos cookies de rastreamento nem de publicidade.</p>
        </section>

      </div>
    </>
  );
}

function PrivacidadeEn() {
  return (
    <>
      <h1 className="text-4xl font-black text-brand-dark mb-2">Privacy Policy</h1>
      <p className="text-brand-muted mb-10">Last updated: October 2026</p>

      <div className="space-y-10 text-gray-700 leading-relaxed">

        <section>
          <h2 className={h2Class}>Data controller</h2>
          <p>
            Quimera Pragmática, Lda. (ReaxOne), tax ID (NIPC) 519180976, with registered office at Rua Gago Coutinho e Sacadura Cabral, n.º 16, 1.º Esq., 2745-112 Queluz, Portugal.
            Contact for privacy matters: {emailLink}.
          </p>
        </section>

        <section>
          <h2 className={h2Class}>Data we collect</h2>
          <p>Name, email, phone number, delivery and billing address, tax number (when you request an invoice with your tax number) and order history. We do not collect or store payment card details.</p>
        </section>

        <section>
          <h2 className={h2Class}>How we use your data and on what legal basis</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Processing, shipping and tracking orders – performance of a contract.</li>
            <li>Issuing invoices and meeting tax obligations – legal obligation.</li>
            <li>Responding to your contact requests – steps taken at your request and legitimate interest.</li>
          </ul>
        </section>

        <section>
          <h2 className={h2Class}>Who we share it with</h2>
          <p>Only with providers needed to deliver the service: carrier (Batch), website hosting (Hetzner) and invoicing software (Weoinvoice). We do not sell or transfer data for commercial purposes.</p>
        </section>

        <section>
          <h2 className={h2Class}>How long we keep it</h2>
          <p>Order and invoice data are kept for 10 years, as required by tax law. All other data is deleted once it is no longer needed.</p>
        </section>

        <section>
          <h2 className={h2Class}>Your rights</h2>
          <p>
            You may request access to, rectification, erasure, restriction or portability of your data, or object to its processing, by writing to {emailLink}.
            We respond within one month at most. You also have the right to lodge a complaint with the Portuguese Data Protection Authority, CNPD ({cnpdLink}).
          </p>
        </section>

        <section>
          <h2 className={h2Class}>Cookies</h2>
          <p>We only use cookies that are essential for the website to work (for example, the login session). We do not use tracking or advertising cookies.</p>
        </section>

      </div>
    </>
  );
}

export default async function PrivacidadePage() {
  const locale = await getLocale();

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      {locale === 'en' ? <PrivacidadeEn /> : <PrivacidadePt />}
    </div>
  );
}
