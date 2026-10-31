import { formatEuro } from '@/lib/settings';
import type { FreeShippingThresholds } from '@/lib/shippingRates';

type Locale = 'pt' | 'en';

const ROWS: { key: keyof FreeShippingThresholds; label: Record<Locale, string> }[] = [
  { key: 'pt', label: { pt: 'Portugal Continental', en: 'Mainland Portugal' } },
  { key: 'es', label: { pt: 'Espanha (continental, Baleares e Canárias)', en: 'Spain (mainland, Balearic and Canary Islands)' } },
  { key: 'eu', label: { pt: 'Restantes países da UE', en: 'Other EU countries' } },
];

// Portes grátis por zona — valores configurados no backoffice (0 = sem portes grátis)
export default function FreeShippingList({ thresholds, locale }: { thresholds: FreeShippingThresholds; locale: string }) {
  const lang: Locale = locale === 'en' ? 'en' : 'pt';
  const rows = ROWS.filter(({ key }) => thresholds[key] > 0);

  return (
    <ul className="mt-2 list-disc pl-6 space-y-1">
      {rows.map(({ key, label }) => (
        <li key={key}>
          {label[lang]}: {lang === 'en' ? 'free from ' : 'grátis a partir de '}
          <strong>{formatEuro(thresholds[key], lang)}</strong>
        </li>
      ))}
      <li>
        {lang === 'en'
          ? 'Azores and Madeira: please contact us before ordering'
          : 'Açores e Madeira: contacte-nos antes de encomendar'}
      </li>
    </ul>
  );
}
