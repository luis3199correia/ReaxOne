'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { CheckCircle, Smartphone, Building2, ArrowRight } from 'lucide-react';
import { whatsappUrl, formatWhatsappDisplay } from '@/lib/settings';
import { useSettings } from '@/components/providers/SettingsProvider';

function ConfirmacaoContent() {
  const params   = useSearchParams();
  const locale   = useLocale();
  const settings = useSettings();
  const orderId  = params.get('order') ?? '';
  const total    = params.get('total') ?? '0.00';
  const method   = params.get('method') ?? 'mbway';
  const email    = params.get('email') ?? '';

  const shortId = orderId.slice(-8).toUpperCase();

  return (
    <div className="max-w-lg mx-auto px-6 py-16 text-center">

      {/* Ícone */}
      <div className="w-20 h-20 bg-brand-green/20 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-10 h-10 text-brand-green" />
      </div>

      <h1 className="text-3xl font-bold text-brand-dark mb-2">Encomenda recebida!</h1>
      <p className="text-gray-500 mb-8">
        Referência: <span className="font-semibold text-brand-dark">#{shortId}</span>
      </p>

      {/* Instruções de pagamento */}
      <div className="card p-6 text-left mb-6">
        {method === 'mbway' ? (
          <>
            <div className="flex items-center gap-3 mb-4">
              <Smartphone className="w-5 h-5 text-brand-primary flex-shrink-0" />
              <h2 className="font-semibold text-brand-dark">Pagamento por MB Way</h2>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              Vai receber um pedido de pagamento de <strong>€{total}</strong> no teu telemóvel.
              Aceita o pagamento na aplicação MB Way.
            </p>
            {settings.whatsappEnabled ? (
              <p className="text-sm text-gray-500">
                Se não receberes o pedido em alguns minutos, entra em contacto connosco pelo WhatsApp:{' '}
                <a href={whatsappUrl(settings.whatsappNumber)} className="text-brand-primary font-medium hover:underline">
                  {formatWhatsappDisplay(settings.whatsappNumber)}
                </a>
              </p>
            ) : (
              <p className="text-sm text-gray-500">
                Se não receberes o pedido em alguns minutos, entra em contacto connosco pelo email:{' '}
                <a href={`mailto:${settings.contactEmail}`} className="text-brand-primary font-medium hover:underline">
                  {settings.contactEmail}
                </a>
              </p>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4">
              <Building2 className="w-5 h-5 text-brand-primary flex-shrink-0" />
              <h2 className="font-semibold text-brand-dark">Pagamento por Transferência Bancária</h2>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              Transfere <strong>€{total}</strong> para o IBAN abaixo e indica a referência{' '}
              <strong>#{shortId}</strong> na descrição da transferência.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 text-sm font-mono text-gray-700 space-y-1">
              <p><span className="text-gray-400">IBAN:</span> {settings.iban}</p>
              {settings.ibanHolder && (
                <p><span className="text-gray-400">Titular:</span> {settings.ibanHolder}</p>
              )}
              <p><span className="text-gray-400">Referência:</span> #{shortId}</p>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              A encomenda é processada após confirmação do pagamento (normalmente 1 dia útil).
            </p>
          </>
        )}
      </div>

      {email && (
        <p className="text-sm text-gray-500 mb-8">
          Vamos enviar as atualizações da encomenda para <strong>{email}</strong>.
        </p>
      )}

      <Link
        href={`/${locale}/loja`}
        className="btn-primary inline-flex items-center gap-2"
      >
        Continuar a comprar
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

export default function ConfirmacaoPage() {
  return (
    <Suspense>
      <ConfirmacaoContent />
    </Suspense>
  );
}
