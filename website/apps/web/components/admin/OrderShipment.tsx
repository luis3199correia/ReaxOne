'use client';

import { useState } from 'react';
import { Loader2, PackageCheck, Truck } from 'lucide-react';
import { api } from '@/lib/api';

// Estados da Batch (os mesmos da API: apps/api/src/batch/batch.service.ts)
const BATCH_ON_HOLD = 'em espera';

export interface ShipmentFields {
  batchOrderNumber?: string | null;
  batchStatus?: string | null;
}

interface Props {
  orderId: string;
  orderStatus: string;
  paymentStatus?: string;
  shipment: ShipmentFields;
  onUpdated: (fields: ShipmentFields) => void;
}

/** Envio na Batch: número, estado e a ação "pronta para recolha" depois de embalada. */
export default function OrderShipment({ orderId, orderStatus, paymentStatus, shipment, onUpdated }: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isPaid = paymentStatus === 'CONFIRMED';
  const canMarkReady = !!shipment.batchOrderNumber
    && shipment.batchStatus === BATCH_ON_HOLD
    && orderStatus !== 'CANCELLED';

  async function markReady() {
    if (!confirm('Marcar como pronta para recolha? A transportadora passa a poder recolher a encomenda.')) return;
    setSaving(true);
    setError('');
    try {
      const res = await api.post<ShipmentFields>(`/orders/${orderId}/batch/ready`);
      onUpdated({ batchOrderNumber: res.data.batchOrderNumber, batchStatus: res.data.batchStatus });
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(typeof msg === 'string' ? msg : 'Erro ao mudar o estado na Batch.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Envio (Batch)</h3>

      <p className="flex items-center gap-2 text-sm text-gray-700">
        <Truck className="w-4 h-4 text-gray-400" />
        {shipment.batchOrderNumber
          ? <>N.º {shipment.batchOrderNumber}{shipment.batchStatus && <> · <strong>{shipment.batchStatus}</strong></>}</>
          : isPaid
            ? <span className="text-red-700">Ainda não está na Batch — ver os logs da API.</span>
            : <span className="text-gray-500">Criada na Batch (em espera) quando o pagamento for confirmado.</span>}
      </p>

      {canMarkReady && (
        <button
          onClick={markReady}
          disabled={saving}
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-brand-primary hover:underline disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <PackageCheck className="w-4 h-4" />}
          Marcar como pronta para recolha
        </button>
      )}

      {error && <p className="text-xs text-red-700 mt-1">{error}</p>}
    </div>
  );
}
