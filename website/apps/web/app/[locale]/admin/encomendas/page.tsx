'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ChevronDown, ChevronUp, CheckCircle, Loader2, RefreshCw, XCircle, Trash2, AlertCircle } from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  PENDING:   'Pendente',
  PAID:      'Pago',
  SHIPPED:   'Enviado',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING:   'bg-yellow-100 text-yellow-800',
  PAID:      'bg-blue-100 text-blue-800',
  SHIPPED:   'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const PAYMENT_LABELS: Record<string, string> = {
  MBWAY:         'MB Way',
  BANK_TRANSFER: 'Transferência',
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING:   'Por confirmar',
  CONFIRMED: 'Confirmado',
  FAILED:    'Falhado',
};

type OrderItem = {
  id: string;
  name: string;
  quantity: number;
  price: number;
  size?: string;
};

type Order = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  status: string;
  totalAmount: number;
  shippingMethod?: string;
  shippingCost?: number;
  createdAt: string;
  items: OrderItem[];
  payment?: { method: string; status: string };
};

export default function AdminEncomendas() {
  const [orders, setOrders]       = useState<Order[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [expanded, setExpanded]   = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [selected, setSelected]   = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [deleting, setDeleting]   = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [bulkStatus, setBulkStatus] = useState('PENDING');
  const [bulkUpdating, setBulkUpdating] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/orders');
      setOrders(res.data);
    } catch {
      setError('Erro ao carregar encomendas.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function confirmPayment(id: string) {
    setConfirming(id);
    try {
      await api.patch(`/orders/${id}/confirm-payment`);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === id
            ? { ...o, status: 'PAID', payment: o.payment ? { ...o.payment, status: 'CONFIRMED' } : o.payment }
            : o
        )
      );
    } catch {
      alert('Erro ao confirmar pagamento.');
    } finally {
      setConfirming(null);
    }
  }

  async function updateStatus(id: string, status: string) {
    setUpdatingStatus(id);
    try {
      await api.patch(`/orders/${id}/status`, { status });
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status } : o))
      );
    } catch {
      alert('Erro ao atualizar estado.');
    } finally {
      setUpdatingStatus(null);
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function toggleSelectAll() {
    setSelected((prev) => (prev.length === orders.length ? [] : orders.map((o) => o.id)));
  }

  async function deleteOne(id: string) {
    setDeleting(true);
    setDeleteError('');
    try {
      await api.delete(`/orders/${id}`);
      setOrders((prev) => prev.filter((o) => o.id !== id));
      setSelected((prev) => prev.filter((x) => x !== id));
      setDeleteTarget(null);
    } catch (err: any) {
      setDeleteError(err?.response?.data?.message ?? 'Erro ao apagar a encomenda.');
    } finally {
      setDeleting(false);
    }
  }

  async function bulkDelete() {
    setDeleting(true);
    setDeleteError('');
    try {
      await api.delete('/orders/bulk', { data: { ids: selected } });
      setOrders((prev) => prev.filter((o) => !selected.includes(o.id)));
      setSelected([]);
      setBulkDeleteConfirm(false);
    } catch (err: any) {
      setDeleteError(err?.response?.data?.message ?? 'Erro ao apagar as encomendas.');
    } finally {
      setDeleting(false);
    }
  }

  async function bulkUpdateStatus() {
    setBulkUpdating(true);
    try {
      await api.patch('/orders/bulk/status', { ids: selected, status: bulkStatus });
      setOrders((prev) =>
        prev.map((o) => (selected.includes(o.id) ? { ...o, status: bulkStatus } : o))
      );
      setSelected([]);
    } catch {
      alert('Erro ao atualizar o estado das encomendas selecionadas.');
    } finally {
      setBulkUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <h1 className="text-2xl font-bold text-brand-dark">Encomendas</h1>
        <button onClick={load} className="btn-secondary flex items-center gap-2 text-sm py-2">
          <RefreshCw className="w-4 h-4" /> Atualizar
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
          {error}
        </div>
      )}

      {selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 bg-brand-dark text-white rounded-lg px-4 py-3 mb-4 text-sm">
          <span className="font-medium">{selected.length} selecionada{selected.length > 1 ? 's' : ''}</span>
          <select
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value)}
            className="text-xs font-semibold px-2 py-1.5 rounded-md text-brand-dark"
          >
            {Object.entries(STATUS_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
          <button
            onClick={bulkUpdateStatus}
            disabled={bulkUpdating}
            className="btn-secondary flex items-center gap-2 text-xs py-1.5 px-3"
          >
            {bulkUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
            Mudar estado
          </button>
          <button
            onClick={() => setBulkDeleteConfirm(true)}
            className="flex items-center gap-2 text-xs py-1.5 px-3 rounded-lg bg-red-500 hover:bg-red-600 transition-colors font-semibold"
          >
            <Trash2 className="w-3.5 h-3.5" /> Apagar selecionadas
          </button>
          <button
            onClick={() => setSelected([])}
            className="text-xs text-gray-300 hover:text-white ml-auto"
          >
            Limpar seleção
          </button>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="card px-6 py-12 text-center text-gray-500 text-sm">
          Sem encomendas ainda.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={selected.length === orders.length && orders.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cliente</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Data</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Pagamento</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => {
                  const shortId = order.id.slice(-8).toUpperCase();
                  const isOpen  = expanded === order.id;
                  const isPending = order.payment?.status === 'PENDING';

                  return (
                    <>
                      <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selected.includes(order.id)}
                            onChange={() => toggleSelect(order.id)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-gray-500">#{shortId}</td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-brand-dark">
                            {order.firstName} {order.lastName}
                          </p>
                          <p className="text-xs text-gray-500">{order.email}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">
                          {new Date(order.createdAt).toLocaleDateString('pt-PT', {
                            day: '2-digit', month: '2-digit', year: 'numeric',
                          })}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <p className="text-sm text-gray-700">
                            {PAYMENT_LABELS[order.payment?.method ?? ''] ?? order.payment?.method}
                          </p>
                          <p className={`text-xs font-medium ${order.payment?.status === 'CONFIRMED' ? 'text-green-600' : 'text-yellow-600'}`}>
                            {PAYMENT_STATUS_LABELS[order.payment?.status ?? ''] ?? order.payment?.status}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={order.status}
                            disabled={updatingStatus === order.id}
                            onChange={(e) => updateStatus(order.id, e.target.value)}
                            className={`text-xs font-semibold px-2 py-1 rounded-full border-0 cursor-pointer focus:ring-1 focus:ring-brand-primary ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-700'}`}
                          >
                            {Object.entries(STATUS_LABELS).map(([val, label]) => (
                              <option key={val} value={val}>{label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-right text-brand-dark">
                          €{order.totalAmount.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setDeleteTarget(order.id)}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                              title="Apagar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setExpanded(isOpen ? null : order.id)}
                              className="p-1 text-gray-400 hover:text-gray-700 transition-colors"
                            >
                              {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {isOpen && (
                        <tr key={`${order.id}-detail`}>
                          <td colSpan={8} className="bg-gray-50 px-4 py-4 border-b">
                            <div className="grid md:grid-cols-2 gap-6">

                              {/* Itens */}
                              <div>
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Itens</h3>
                                <div className="space-y-1">
                                  {order.items.map((item) => (
                                    <div key={item.id} className="flex justify-between text-sm">
                                      <span className="text-gray-700">
                                        {item.quantity}× {item.name}
                                        {item.size && <span className="text-gray-400 ml-1">({item.size})</span>}
                                      </span>
                                      <span className="font-medium">€{(item.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                  ))}
                                  {order.shippingMethod && (
                                    <div className="flex justify-between text-sm text-gray-500 pt-1 border-t">
                                      <span>{order.shippingMethod}</span>
                                      <span>€{(order.shippingCost ?? 0).toFixed(2)}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Morada + ações */}
                              <div className="space-y-4">
                                <div>
                                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Morada</h3>
                                  <p className="text-sm text-gray-700 leading-relaxed">
                                    {order.street}<br />
                                    {order.postalCode} {order.city}<br />
                                    {order.country}
                                  </p>
                                  <p className="text-sm text-gray-500 mt-1">{order.phone}</p>
                                </div>

                                <div className="flex flex-col gap-2">
                                  {isPending && (
                                    <button
                                      onClick={() => confirmPayment(order.id)}
                                      disabled={confirming === order.id}
                                      className="btn-primary flex items-center gap-2 text-sm py-2"
                                    >
                                      {confirming === order.id
                                        ? <><Loader2 className="w-4 h-4 animate-spin" /> A confirmar…</>
                                        : <><CheckCircle className="w-4 h-4" /> Confirmar Pagamento</>
                                      }
                                    </button>
                                  )}
                                  {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
                                    <button
                                      onClick={() => {
                                        if (window.confirm(`Cancelar encomenda #${order.id.slice(-8).toUpperCase()}? Esta ação não pode ser desfeita.`)) {
                                          updateStatus(order.id, 'CANCELLED');
                                        }
                                      }}
                                      disabled={updatingStatus === order.id}
                                      className="flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
                                    >
                                      {updatingStatus === order.id
                                        ? <><Loader2 className="w-4 h-4 animate-spin" /> A cancelar…</>
                                        : <><XCircle className="w-4 h-4" /> Cancelar encomenda</>
                                      }
                                    </button>
                                  )}
                                </div>
                              </div>

                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete confirmation modal (single) */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <h2 className="text-base font-bold text-brand-dark">Apagar encomenda?</h2>
            </div>
            <p className="text-sm text-gray-600 mb-5">Esta ação é irreversível.</p>
            {deleteError && (
              <div className="flex items-start gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                {deleteError}
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => { setDeleteTarget(null); setDeleteError(''); }}
                disabled={deleting}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={() => deleteOne(deleteTarget)}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Apagar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal (bulk) */}
      {bulkDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <h2 className="text-base font-bold text-brand-dark">
                Apagar {selected.length} encomenda{selected.length > 1 ? 's' : ''}?
              </h2>
            </div>
            <p className="text-sm text-gray-600 mb-5">Esta ação é irreversível.</p>
            {deleteError && (
              <div className="flex items-start gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                {deleteError}
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => { setBulkDeleteConfirm(false); setDeleteError(''); }}
                disabled={deleting}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={bulkDelete}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Apagar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
