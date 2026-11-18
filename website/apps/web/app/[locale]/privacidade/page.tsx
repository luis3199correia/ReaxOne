import { getLocale } from 'next-intl/server';

const linkClass = 'text-brand-primary hover:underline';
const h2Class = 'text-xl font-bold text-brand-dark mb-3';

const emailLink = <a href="mailto:contact@reaxone.com" className={linkClass}>contact@reaxone.com</a>;
const cnpdLink = <a href="https://www.cnpd.pt" target="_blank" rel="noopener noreferrer" className={linkClass}>www.cnpd.pt</a>;

function PrivacidadePt() {
  return (
    <>
      <h1 className="text-4xl font-black text-brand-dark mb-2">Política de Privacidade</h1>
      <p className="text-brand-muted mb-10">Última atualização: novembro de 2026</p>

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
          <p>Apenas com prestadores necessários ao serviço: transportadora (Batch), alojamento do site (Hetzner) e software de faturação (Facturalusa). Não vendemos nem cedemos dados para fins comerciais.</p>
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
          <h2 className={h2Class}>Cookies e análise do site</h2>
          <p>O site reaxone.com utiliza cookies, que são pequenos ficheiros guardados no seu dispositivo.</p>
          <ul className="list-disc pl-5 space-y-2 mt-3">
            <li><strong>Cookies necessários:</strong> asseguram o funcionamento do site, como a sessão de login, o carrinho de compras, o checkout e a memória das suas preferências de cookies. Não precisam de consentimento.</li>
            <li><strong>Cookies de análise (Google Analytics 4):</strong> só são ativados se der o seu consentimento no aviso de cookies. Permitem-nos saber, de forma agregada, quantas pessoas visitam o site, que páginas consultam, de onde vêm e que compras são feitas. O objetivo é melhorar o site e a loja. Os cookies utilizados são o _ga e o _ga_*, com duração máxima de 2 anos. Os dados recolhidos são guardados pelo Google Analytics durante 14 meses.</li>
            <li><strong>Cookies de marketing (Google Ads):</strong> só são ativados se der o seu consentimento no aviso de cookies. Servem para medir os resultados das nossas campanhas.</li>
          </ul>
          <p className="mt-3">O Google Analytics é fornecido pela Google Ireland Limited (Gordon House, Barrow Street, Dublin 4, Irlanda). Alguns dados podem ser transferidos para a Google LLC, nos Estados Unidos, ao abrigo do Quadro de Privacidade de Dados UE-EUA (EU-US Data Privacy Framework). Mais informação em <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className={linkClass}>policies.google.com/privacy</a>.</p>
          <p className="mt-3">Pode aceitar, recusar ou retirar o seu consentimento a qualquer momento, através da opção &quot;Preferências de cookies&quot; no rodapé do site. Pode também apagar os cookies nas definições do seu navegador.</p>
        </section>

        <section>
          <h2 className={h2Class}>Pagamentos</h2>
          <p>Os pagamentos são processados pela IfthenPay (Multibanco, MB WAY, cartões, Apple Pay e Google Pay). A ReaxOne não tem acesso nem guarda os dados do seu cartão bancário. A IfthenPay trata os dados necessários ao pagamento de acordo com a sua própria política de privacidade.</p>
        </section>

      </div>
    </>
  );
}

function PrivacidadeEn() {
  return (
    <>
      <h1 className="text-4xl font-black text-brand-dark mb-2">Privacy Policy</h1>
      <p className="text-brand-muted mb-10">Last updated: November 2026</p>

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
          <p>Only with providers needed to deliver the service: carrier (Batch), website hosting (Hetzner) and invoicing software (Facturalusa). We do not sell or transfer data for commercial purposes.</p>
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
          <h2 className={h2Class}>Cookies and website analytics</h2>
          <p>The website reaxone.com uses cookies, which are small files stored on your device.</p>
          <ul className="list-disc pl-5 space-y-2 mt-3">
            <li><strong>Necessary cookies:</strong> they keep the website working, such as the login session, the shopping cart, checkout and your cookie preferences. They do not require consent.</li>
            <li><strong>Analytics cookies (Google Analytics 4):</strong> they are only activated if you give your consent in the cookie banner. They help us understand, in aggregate, how many people visit the website, which pages they view, where they come from and which purchases are made, so we can improve the website and the shop. The cookies used are _ga and _ga_*, lasting up to 2 years. Collected data is kept by Google Analytics for 14 months.</li>
            <li><strong>Marketing cookies (Google Ads):</strong> they are only activated if you give your consent in the cookie banner. They are used to measure the results of our campaigns.</li>
          </ul>
          <p className="mt-3">Google Analytics is provided by Google Ireland Limited (Gordon House, Barrow Street, Dublin 4, Ireland). Some data may be transferred to Google LLC in the United States under the EU-US Data Privacy Framework. More information at <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className={linkClass}>policies.google.com/privacy</a>.</p>
          <p className="mt-3">You can accept, reject or withdraw your consent at any time through &quot;Cookie preferences&quot; in the website footer, and you can delete cookies in your browser settings.</p>
        </section>

        <section>
          <h2 className={h2Class}>Payments</h2>
          <p>Payments are processed by IfthenPay (Multibanco, MB WAY, cards, Apple Pay and Google Pay). ReaxOne has no access to and does not store your card details. IfthenPay processes the data needed for payment under its own privacy policy.</p>
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
