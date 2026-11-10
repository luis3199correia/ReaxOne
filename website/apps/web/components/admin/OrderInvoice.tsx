'use client';

import { useState } from 'react';
import { ExternalLink, FileText, Loader2, RotateCw } from 'lucide-react';
import { api } from '@/lib/api';

export interface InvoiceFields {
  invoiceId?: number | null;
  invoiceNumber?: string | null;
  invoiceUrl?: string | null;
  invoiceStatus?: 'ISSUED' | 'DRAFT' | 'FAILED' | null;
  invoiceError?: string | null;
  invoiceAttempts?: number;
  invoicedAt?: string | null;
}

interface Props {
  orderId: string;
  orderStatus: string;
  paymentStatus?: string;
  invoice: InvoiceFields;
  onUpdated: (fields: InvoiceFields) => void;
}

/** Encomenda com documento no Facturalusa (emitido ou em rascunho) — ao cancelar é preciso nota de crédito. */
export function hasInvoice(invoice: InvoiceFields): boolean {
  return invoice.invoiceStatus === 'ISSUED' || invoice.invoiceStatus === 'DRAFT';
}

/** Fatura da encomenda no detalhe do backoffice: número e PDF, rascunho, ou falha com nova tentativa. */
export default function OrderInvoice({ orderId, orderStatus, paymentStatus, invoice, onUpdated }: Props) {
  const [issuing, setIssuing] = useState(false);
  const [error, setError] = useState('');

  async function issue() {
    setIssuing(true);
    setError('');
    try {
      const res = await api.post<InvoiceFields>(`/orders/${orderId}/invoice`);
      onUpdated(res.data);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(typeof msg === 'string' ? msg : 'Erro ao emitir a fatura.');
    } finally {
      setIssuing(false);
    }
  }

  const canIssue = paymentStatus === 'CONFIRMED' && orderStatus !== 'CANCELLED';
  const status = invoice.invoiceStatus ?? null;

  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Fatura</h3>

      {status === 'ISSUED' && (
        <p className="flex flex-wrap items-center gap-2 text-sm text-gray-700">
          <FileText className="w-4 h-4 text-gray-400" />
          <span className="font-medium">{invoice.invoiceNumber || 'Emitida'}</span>
          {invoice.invoiceUrl && <PdfLink url={invoice.invoiceUrl} />}
        </p>
      )}

      {status === 'DRAFT' && (
        <div className="text-sm text-gray-700">
          <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">Rascunho</span>
          <p className="text-xs text-gray-500 mt-1">Rever e finalizar no Facturalusa (que envia a fatura ao cliente).</p>
          {invoice.invoiceUrl && <PdfLink url={invoice.invoiceUrl} />}
        </div>
      )}

      {status === 'FAILED' && (
        <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-800 break-words">
          Falhou: {invoice.invoiceError || 'erro desconhecido'}
        </span>
      )}

      {status !== 'FAILED' && invoice.invoiceError && (
        <p className="text-xs text-amber-700 mt-1">{invoice.invoiceError}</p>
      )}

      {status === null && !canIssue && <p className="text-sm text-gray-400">Sem fatura.</p>}

      {(status === null || status === 'FAILED') && canIssue && (
        <button
          type="button"
          onClick={issue}
          disabled={issuing}
          className="btn-secondary flex items-center gap-2 text-sm py-2 mt-2"
        >
          {issuing
            ? <><Loader2 className="w-4 h-4 animate-spin" /> A emitir…</>
            : status === 'FAILED'
              ? <><RotateCw className="w-4 h-4" /> Tentar novamente</>
              : <><FileText className="w-4 h-4" /> Emitir fatura</>}
        </button>
      )}

      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

function PdfLink({ url }: { url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-sm font-medium text-brand-primary hover:underline"
    >
      PDF <ExternalLink className="w-3.5 h-3.5" />
    </a>
  );
}
