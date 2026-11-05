'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, CreditCard, Landmark, Loader2, Smartphone, XCircle } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { api } from '@/lib/api';
import { formatMbReference } from '@/lib/payments';

const POLL_INTERVAL_MS = 4_000;
const POLL_MAX_MS = 15 * 60_000;

type PaymentState = 'pending' | 'paid' | 'cancelled';

/** Consulta o estado do pagamento até ficar pago ou cancelado (callback da IfthenPay). */
export function usePaymentState(orderId: string, enabled: boolean): PaymentState {
  const [state, setState] = useState<PaymentState>('pending');

  useEffect(() => {
    if (!enabled || !orderId) return;
    let stopped = false;
    const startedAt = Date.now();

    const check = async () => {
      try {
        const res = await api.get<{ paymentStatus: string; orderStatus: string }>(`/payments/${orderId}/status`);
        if (stopped) return;
        if (res.data.paymentStatus === 'CONFIRMED') { setState('paid'); return; }
        if (res.data.orderStatus === 'CANCELLED') { setState('cancelled'); return; }
      } catch {
        /* falha de rede: tenta de novo no próximo ciclo */
      }
      if (!stopped && Date.now() - startedAt < POLL_MAX_MS) timer = setTimeout(check, POLL_INTERVAL_MS);
    };
    let timer = setTimeout(check, 0);
    return () => { stopped = true; clearTimeout(timer); };
  }, [orderId, enabled]);

  return state;
}

function Header({ icon: Icon, title }: { icon: typeof Smartphone; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <Icon className="w-5 h-5 text-brand-primary flex-shrink-0" />
      <h2 className="font-semibold text-brand-dark">{title}</h2>
    </div>
  );
}

function PaidNotice() {
  return (
    <p className="flex items-center gap-2 text-sm font-medium text-brand-green">
      <CheckCircle className="w-4 h-4" /> Pagamento confirmado. Obrigado! Vais receber um email com os detalhes.
    </p>
  );
}

function FailedNotice({ message }: { message: string }) {
  return (
    <div className="space-y-3">
      <p className="flex items-start gap-2 text-sm text-red-600">
        <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {message}
      </p>
      <Link href="/checkout" className="text-sm font-medium text-brand-primary hover:underline">
        Voltar ao checkout e tentar de novo →
      </Link>
    </div>
  );
}

export function MbwayPayment({ orderId, total, phone }: { orderId: string; total: string; phone: string }) {
  const state = usePaymentState(orderId, true);
  return (
    <>
      <Header icon={Smartphone} title="Pagamento por MB WAY" />
      {state === 'paid' && <PaidNotice />}
      {state === 'cancelled' && (
        <FailedNotice message="O pedido MB WAY expirou ou foi recusado, e a encomenda foi cancelada." />
      )}
      {state === 'pending' && (
        <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
          <p>
            Enviámos um pedido de <strong>€{total}</strong>{phone && <> para o número <strong>{phone}</strong></>}.
            Abre a app MB WAY e aceita o pagamento nos próximos 4 minutos.
          </p>
          <p className="flex items-center gap-2 text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" /> À espera da confirmação…
          </p>
        </div>
      )}
    </>
  );
}

export function MultibancoPayment({ orderId, total, entity, reference, expires }: {
  orderId: string; total: string; entity: string; reference: string; expires: string;
}) {
  const state = usePaymentState(orderId, true);
  const expiresDate = expires ? new Date(expires) : null;
  return (
    <>
      <Header icon={Landmark} title="Pagamento por Multibanco" />
      {state === 'paid' ? (
        <PaidNotice />
      ) : state === 'cancelled' ? (
        <FailedNotice message="A referência expirou sem pagamento e a encomenda foi cancelada." />
      ) : (
        <>
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            Paga no multibanco ou no homebanking com os dados abaixo. A confirmação é automática.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 text-sm font-mono text-gray-700 space-y-1">
            <p><span className="text-gray-400">Entidade:</span> {entity}</p>
            <p><span className="text-gray-400">Referência:</span> {formatMbReference(reference)}</p>
            <p><span className="text-gray-400">Valor:</span> €{total}</p>
          </div>
          {expiresDate && !Number.isNaN(expiresDate.getTime()) && (
            <p className="text-xs text-gray-400 mt-3">
              Paga até {expiresDate.toLocaleDateString('pt-PT')}. Depois disso a encomenda é cancelada.
            </p>
          )}
        </>
      )}
    </>
  );
}

export function GatewayPayment({ orderId, method, result, onPaid }: {
  orderId: string; method: 'card' | 'applepay' | 'googlepay'; result: string; onPaid: () => void;
}) {
  const returnedOk = result === 'success';
  const state = usePaymentState(orderId, returnedOk);
  const title = method === 'applepay' ? 'Pagamento por Apple Pay'
    : method === 'googlepay' ? 'Pagamento por Google Pay'
    : 'Pagamento por cartão';

  useEffect(() => {
    if (state === 'paid') onPaid();
  }, [state, onPaid]);

  return (
    <>
      <Header icon={CreditCard} title={title} />
      {!returnedOk ? (
        <FailedNotice message="O pagamento não foi concluído. Não te cobrámos nada." />
      ) : state === 'paid' ? (
        <PaidNotice />
      ) : state === 'cancelled' ? (
        <FailedNotice message="O pagamento não foi confirmado e a encomenda foi cancelada." />
      ) : (
        <p className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" /> A confirmar o pagamento…
        </p>
      )}
    </>
  );
}
