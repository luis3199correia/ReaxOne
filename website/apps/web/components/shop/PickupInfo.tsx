import { MapPin, AlertTriangle, ExternalLink } from 'lucide-react';
import { PICKUP_ADDRESS, PICKUP_MAPS_URL, PICKUP_PLACE } from '@/lib/pickup';

// Local de levantamento + passos para agendar (checkout e confirmação)
export default function PickupInfo({ reference }: { reference?: string }) {
  return (
    <div className="space-y-3 text-left">
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700">
        <p className="font-semibold text-brand-dark flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-brand-primary" /> {PICKUP_PLACE}
        </p>
        <p className="mt-1">{PICKUP_ADDRESS}</p>
        <a
          href={PICKUP_MAPS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 mt-2 text-brand-primary font-medium hover:underline"
        >
          Ver no mapa <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
        <p className="font-semibold flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4 text-amber-500" /> O levantamento tem de ser agendado
        </p>
        <ol className="list-decimal pl-5 mt-2 space-y-1">
          <li>Contactamos-te por <strong>WhatsApp</strong>, para o telefone indicado na encomenda, para combinarmos o dia e a hora.</li>
          <li>Levantas a encomenda no {PICKUP_PLACE}, no dia e hora combinados{reference ? <> — indica a referência <strong>#{reference}</strong></> : null}.</li>
          <li>Se escolheres pagamento em mão, pagas no momento do levantamento.</li>
        </ol>
        <p className="mt-2">Não te desloques ao clube sem marcação: a encomenda só fica disponível depois de agendada.</p>
      </div>
    </div>
  );
}
