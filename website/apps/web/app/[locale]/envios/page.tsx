import { getLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import ShippingRatesTable from '@/components/shop/ShippingRatesTable';
import FreeShippingList from '@/components/shop/FreeShippingList';
import { PICKUP_ADDRESS, PICKUP_MAPS_URL, PICKUP_PLACE } from '@/lib/pickup';
import type { FreeShippingThresholds } from '@/lib/shippingRates';
import { whatsappUrl, formatWhatsappDisplay, fetchPublicSettings, getFreeShippingThresholds } from '@/lib/settings';

const linkClass = 'text-brand-primary hover:underline';
const h2Class = 'text-xl font-bold text-brand-dark mb-3';

const emailLink = <a href="mailto:contact@reaxone.com" className={linkClass}>contact@reaxone.com</a>;
const whatsappLink = <a href="https://wa.me/351928456870" target="_blank" rel="noopener noreferrer" className={linkClass}>+351 928 456 870</a>;

function EnviosPt({ thresholds }: { thresholds: FreeShippingThresholds }) {
  return (
    <>
      <section>
        <h2 className={h2Class}>Envios</h2>
        <p>Processamos as encomendas em 1 a 2 dias úteis após a confirmação do pagamento. A entrega em Portugal Continental demora <strong>2 a 4 dias úteis</strong>. Também enviamos para Espanha e para vários países da União Europeia.</p>
        <p className="mt-3">Portes para Portugal Continental: <strong>4,93 €</strong> (IVA incluído). Os portes para os restantes destinos constam da tabela abaixo.</p>
        <ShippingRatesTable locale="pt" />
        <p className="mt-4"><strong>Portes grátis</strong> (subtotal da encomenda):</p>
        <FreeShippingList thresholds={thresholds} locale="pt" />
        <p className="mt-4"><strong>Levantamento (sem portes):</strong> pode levantar a encomenda no <strong>{PICKUP_PLACE}</strong>, {PICKUP_ADDRESS} (<a href={PICKUP_MAPS_URL} target="_blank" rel="noopener noreferrer" className={linkClass}>ver no mapa</a>). O levantamento é feito <strong>apenas mediante marcação</strong>: após a encomenda, contactamo-lo por WhatsApp, para o telefone indicado, para combinar o dia e a hora. Por favor, não se desloque ao clube sem marcação. Nas encomendas com levantamento pode pagar em mão no momento da entrega.</p>
      </section>

      <section>
        <h2 className={h2Class}>Métodos de pagamento</h2>
        <p>Aceitamos pagamento por <strong>MB Way</strong> e <strong>transferência bancária</strong>. Após a confirmação da encomenda, receberá as instruções de pagamento por email. Se escolher levantar a encomenda, pode também pagar em mão no momento do levantamento.</p>
      </section>

      <section>
        <h2 className={h2Class}>Devoluções</h2>
        <p>Tem <strong>14 dias</strong> a contar da receção para devolver qualquer produto, sem indicar motivo. Contacte-nos por email ({emailLink}) ou WhatsApp ({whatsappLink}) com o número da encomenda e enviamos-lhe por email as instruções e a morada de devolução. Em Portugal Continental, os portes de devolução são por nossa conta. Nos restantes países, os portes de devolução são suportados pelo cliente.</p>
        <p className="mt-3">O reembolso é feito no prazo máximo de 14 dias, pelo mesmo meio de pagamento.</p>
      </section>

      <section>
        <h2 className={h2Class}>Produtos com defeito</h2>
        <p>Todos os produtos têm <strong>3 anos de garantia legal</strong>. Se algum chegar com defeito, envie-nos fotografias e o número da encomenda e resolvemos a situação sem custos para si.</p>
      </section>
    </>
  );
}

function EnviosEn({ thresholds }: { thresholds: FreeShippingThresholds }) {
  return (
    <>
      <section>
        <h2 className={h2Class}>Shipping</h2>
        <p>We process orders within 1 to 2 business days after payment confirmation. Delivery in mainland Portugal takes <strong>2 to 4 business days</strong>. We also ship to Spain and to several European Union countries.</p>
        <p className="mt-3">Shipping to mainland Portugal: <strong>€4.93</strong> (VAT included). Shipping costs for other destinations are listed in the table below.</p>
        <ShippingRatesTable locale="en" />
        <p className="mt-4"><strong>Free shipping</strong> (order subtotal):</p>
        <FreeShippingList thresholds={thresholds} locale="en" />
        <p className="mt-4"><strong>Pickup (free):</strong> you can collect your order at <strong>{PICKUP_PLACE}</strong>, {PICKUP_ADDRESS} (<a href={PICKUP_MAPS_URL} target="_blank" rel="noopener noreferrer" className={linkClass}>view on map</a>). Pickup is <strong>by appointment only</strong>: after you place your order, we will contact you on WhatsApp, at the phone number provided, to arrange the day and time. Please do not go to the club without an appointment. Pickup orders can be paid in person on collection.</p>
      </section>

      <section>
        <h2 className={h2Class}>Payment methods</h2>
        <p>We accept <strong>MB Way</strong> and <strong>bank transfer</strong>. Once your order is confirmed, you will receive the payment instructions by email. If you choose to collect your order, you can also pay in person on pickup.</p>
      </section>

      <section>
        <h2 className={h2Class}>Returns</h2>
        <p>You have <strong>14 days</strong> from receipt to return any product, without giving a reason. Contact us by email ({emailLink}) or WhatsApp ({whatsappLink}) with your order number and we will email you the return instructions and address. In mainland Portugal, return shipping is on us. In other countries, return shipping is paid by the customer.</p>
        <p className="mt-3">Refunds are made within 14 days at most, using the same payment method.</p>
      </section>

      <section>
        <h2 className={h2Class}>Defective products</h2>
        <p>All products come with a <strong>3-year legal guarantee</strong>. If anything arrives defective, send us photos and your order number and we will sort it out at no cost to you.</p>
      </section>
    </>
  );
}

export default async function EnviosPage() {
  const locale = await getLocale();
  const settings = await fetchPublicSettings();
  const isEn = locale === 'en';

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-black text-brand-dark mb-2">{isEn ? 'Shipping & Returns' : 'Envios e Devoluções'}</h1>
      <p className="text-brand-muted mb-10">
        {isEn ? 'Information on delivery times, costs and our returns policy.' : 'Informação sobre prazos, custos e política de devoluções.'}
      </p>

      <div className="space-y-10 text-gray-700 leading-relaxed">

        {isEn
          ? <EnviosEn thresholds={getFreeShippingThresholds(settings)} />
          : <EnviosPt thresholds={getFreeShippingThresholds(settings)} />}

        <section>
          <h2 className={h2Class}>{isEn ? 'Contact' : 'Contacto'}</h2>
          <p>{isEn ? 'For any question about your order, get in touch:' : 'Para qualquer questão sobre a sua encomenda, fale connosco:'}</p>
          <ul className="mt-2 space-y-1">
            <li>📧 <a href={`mailto:${settings.contactEmail}`} className={linkClass}>{settings.contactEmail}</a></li>
            {settings.whatsappEnabled && (
              <li>📱 <a href={whatsappUrl(settings.whatsappNumber)} className={linkClass}>{formatWhatsappDisplay(settings.whatsappNumber)}</a></li>
            )}
          </ul>
        </section>

      </div>

      <div className="mt-12">
        <Link href="/loja" className="btn-primary inline-block">
          {isEn ? 'Back to shop' : 'Voltar à loja'}
        </Link>
      </div>
    </div>
  );
}
