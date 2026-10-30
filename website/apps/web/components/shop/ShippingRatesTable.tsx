import { getShippingOptions, type ShippingZone } from '@/lib/shippingRates';
import { formatEuro } from '@/lib/settings';

type Locale = 'pt' | 'en';

// Zonas com envio online — os preços vêm de lib/shippingRates.ts (os mesmos do checkout)
const ZONES: { zone: Exclude<ShippingZone, 'BLOCKED' | 'PT_ILHAS'>; label: Record<Locale, string> }[] = [
  { zone: 'PT_CONTINENTAL', label: { pt: 'Portugal Continental', en: 'Mainland Portugal' } },
  { zone: 'ES_CONTINENTAL', label: { pt: 'Espanha Continental', en: 'Mainland Spain' } },
  { zone: 'ES_ILHAS', label: { pt: 'Ilhas Baleares e Canárias', en: 'Balearic and Canary Islands' } },
  {
    zone: 'ZONA2',
    label: {
      pt: 'Alemanha, Áustria, Bélgica, Eslováquia, Eslovénia, França, Grécia, Hungria, Irlanda, Itália, Lituânia, Países Baixos, República Checa',
      en: 'Austria, Belgium, Czech Republic, France, Germany, Greece, Hungary, Ireland, Italy, Lithuania, Netherlands, Slovakia, Slovenia',
    },
  },
  {
    zone: 'ZONA3',
    label: {
      pt: 'Dinamarca, Estónia, Finlândia, Letónia, Malta, Polónia, Suécia',
      en: 'Denmark, Estonia, Finland, Latvia, Malta, Poland, Sweden',
    },
  },
];

const HEADERS: Record<Locale, [string, string, string]> = {
  pt: ['Destino', 'Prazo (dias úteis)', 'Portes (IVA incl.)'],
  en: ['Destination', 'Delivery (business days)', 'Shipping (VAT incl.)'],
};

export default function ShippingRatesTable({ locale }: { locale: string }) {
  const lang: Locale = locale === 'en' ? 'en' : 'pt';
  const [destination, days, price] = HEADERS[lang];

  return (
    <div className="overflow-x-auto mt-4">
      <table className="w-full text-sm border border-gray-200">
        <thead className="bg-gray-50 text-left text-brand-dark">
          <tr>
            <th className="p-3 font-semibold">{destination}</th>
            <th className="p-3 font-semibold whitespace-nowrap">{days}</th>
            <th className="p-3 font-semibold whitespace-nowrap">{price}</th>
          </tr>
        </thead>
        <tbody>
          {ZONES.map(({ zone, label }) => {
            const options = getShippingOptions(zone);
            return (
              <tr key={zone} className="border-t border-gray-200 align-top">
                <td className="p-3">{label[lang]}</td>
                <td className="p-3 whitespace-nowrap">{options.map((o) => o.deliveryDays).join(' / ')}</td>
                <td className="p-3 whitespace-nowrap">{options.map((o) => formatEuro(o.price, lang)).join(' / ')}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
