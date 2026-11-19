'use client';

import { useState } from 'react';
import { BookOpen, Loader2, Send } from 'lucide-react';
import { api } from '@/lib/api';

export interface EbookFields {
  digitalWaiverAt?: string | null; // só existe em encomendas com ebooks pagos
  ebooksSentAt?: string | null;
}

interface Props {
  orderId: string;
  paymentStatus?: string;
  ebooks: EbookFields;
  onUpdated: (fields: EbookFields) => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' });
}

/** Ebooks pagos no detalhe da encomenda: quando foram enviados e botão para reenviar. */
export default function OrderEbooks({ orderId, paymentStatus, ebooks, onUpdated }: Props) {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  if (!ebooks.digitalWaiverAt) return null;

  async function resend() {
    setSending(true);
    setError('');
    try {
      const res = await api.post<{ ebooksSentAt: string | null }>(`/orders/${orderId}/ebooks/resend`);
      onUpdated({ ebooksSentAt: res.data.ebooksSentAt });
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(typeof msg === 'string' ? msg : 'Erro ao enviar os ebooks.');
    } finally {
      setSending(false);
    }
  }

  const isPaid = paymentStatus === 'CONFIRMED';

  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Ebooks</h3>

      <p className="flex items-center gap-2 text-sm text-gray-700">
        <BookOpen className="w-4 h-4 text-gray-400" />
        {ebooks.ebooksSentAt
          ? <>Enviados por email a {formatDate(ebooks.ebooksSentAt)}</>
          : isPaid
            ? <span className="text-red-700">Ainda não enviados — ver os logs da API ou reenviar.</span>
            : <span className="text-gray-500">Enviados por email quando o pagamento for confirmado.</span>}
      </p>

      {isPaid && (
        <button
          onClick={resend}
          disabled={sending}
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-brand-primary hover:underline disabled:opacity-50"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {ebooks.ebooksSentAt ? 'Reenviar ebooks' : 'Enviar ebooks'}
        </button>
      )}

      {error && <p className="text-xs text-red-700 mt-1">{error}</p>}
    </div>
  );
}
