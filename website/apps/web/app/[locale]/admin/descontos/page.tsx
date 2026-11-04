'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, ToggleLeft, ToggleRight, Trash2, X, Check, Loader2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';

type DiscountType = 'PERCENTAGE' | 'FIXED';

interface Discount {
  id: string;
  code: string;
  description: string | null;
  type: DiscountType;
  value: number;
  active: boolean;
  minOrderAmount: number | null;
  maxUses: number | null;
  usedCount: number;
  startsAt: string | null;
  expiresAt: string | null;
}

interface DiscountForm {
  code: string;
  description: string;
  type: DiscountType;
  value: string;
  minOrderAmount: string;
  maxUses: string;
  startsAt: string;
  expiresAt: string;
}

const EMPTY_FORM: DiscountForm = {
  code: '', description: '', type: 'PERCENTAGE', value: '',
  minOrderAmount: '', maxUses: '', startsAt: '', expiresAt: '',
};

/** ISO → valor de <input type="date"> (YYYY-MM-DD, hora local). */
function toDateInput(iso: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Início do dia para "desde", fim do dia para "até" (hora local). */
function fromDateInput(value: string, endOfDay: boolean) {
  if (!value) return null;
  return new Date(`${value}T${endOfDay ? '23:59:59' : '00:00:00'}`).toISOString();
}

function formatValue(d: Discount) {
  return d.type === 'PERCENTAGE' ? `${d.value}%` : `€${d.value.toFixed(2)}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-PT');
}

function validityLabel(d: Discount) {
  if (d.startsAt && d.expiresAt) return `${formatDate(d.startsAt)} – ${formatDate(d.expiresAt)}`;
  if (d.expiresAt) return `até ${formatDate(d.expiresAt)}`;
  if (d.startsAt) return `desde ${formatDate(d.startsAt)}`;
  return 'Sem limite';
}

function isExpired(d: Discount) {
  return !!d.expiresAt && new Date(d.expiresAt) < new Date();
}

function toPayload(form: DiscountForm) {
  return {
    code:           form.code.trim().toUpperCase(),
    description:    form.description.trim() || null,
    type:           form.type,
    value:          Number(form.value),
    minOrderAmount: form.minOrderAmount === '' ? null : Number(form.minOrderAmount),
    maxUses:        form.maxUses === '' ? null : Number(form.maxUses),
    startsAt:       fromDateInput(form.startsAt, false),
    expiresAt:      fromDateInput(form.expiresAt, true),
  };
}

export default function AdminDiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<Discount | null>(null);
  const [form, setForm] = useState<DiscountForm>(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Discount | null>(null);

  function fetchDiscounts() {
    setLoading(true);
    api.get('/discounts')
      .then((res) => setDiscounts(res.data))
      .catch(() => setError('Erro ao carregar códigos de desconto.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchDiscounts(); }, []);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setModal('create');
  }

  function openEdit(d: Discount) {
    setEditing(d);
    setForm({
      code:           d.code,
      description:    d.description ?? '',
      type:           d.type,
      value:          String(d.value),
      minOrderAmount: d.minOrderAmount != null ? String(d.minOrderAmount) : '',
      maxUses:        d.maxUses != null ? String(d.maxUses) : '',
      startsAt:       toDateInput(d.startsAt),
      expiresAt:      toDateInput(d.expiresAt),
    });
    setFormError('');
    setModal('edit');
  }

  function closeModal() {
    setModal(null);
    setEditing(null);
    setSaving(false);
    setSaved(false);
  }

  function setField<K extends keyof DiscountForm>(key: K, value: DiscountForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    if (!form.code.trim() || !form.value) return;
    setSaving(true);
    setFormError('');
    try {
      if (modal === 'create') {
        await api.post('/discounts', { ...toPayload(form), active: true });
      } else if (editing) {
        await api.patch(`/discounts/${editing.id}`, toPayload(form));
      }
      setSaved(true);
      setTimeout(() => { closeModal(); fetchDiscounts(); }, 800);
    } catch (e: any) {
      setFormError(e?.response?.data?.message ?? 'Erro ao guardar o código de desconto.');
      setSaving(false);
    }
  }

  async function toggleActive(d: Discount) {
    // Optimistic update
    setDiscounts((prev) => prev.map((x) => (x.id === d.id ? { ...x, active: !x.active } : x)));
    try {
      await api.patch(`/discounts/${d.id}`, { active: !d.active });
    } catch {
      setDiscounts((prev) => prev.map((x) => (x.id === d.id ? { ...x, active: d.active } : x)));
      setError('Não foi possível alterar o estado do código.');
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.delete(`/discounts/${id}`);
      setDeleteConfirm(null);
      fetchDiscounts();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Não foi possível apagar este código.');
      setDeleteConfirm(null);
    }
  }

  const activeCount = discounts.filter((d) => d.active).length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">Códigos de desconto</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? '...' : `${discounts.length} código${discounts.length !== 1 ? 's' : ''} · ${activeCount} ativo${activeCount !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Novo código</span>
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center justify-between gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-6 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20 text-brand-muted">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          A carregar...
        </div>
      )}

      {/* Table */}
      {!loading && (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Código</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Desconto</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Utilizações</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Validade</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ativo</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {discounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-400 text-sm">
                    Nenhum código de desconto. Clica em &quot;Novo código&quot; para começar.
                  </td>
                </tr>
              ) : (
                discounts.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <code className="text-sm font-semibold text-brand-dark bg-gray-100 px-2 py-1 rounded">{d.code}</code>
                      {d.description && <p className="text-xs text-gray-400 mt-1">{d.description}</p>}
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-semibold text-brand-dark">{formatValue(d)}</p>
                      {d.minOrderAmount != null && (
                        <p className="text-xs text-gray-400">mín. €{d.minOrderAmount.toFixed(2)}</p>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 hidden md:table-cell">
                      {d.usedCount}{d.maxUses != null ? ` / ${d.maxUses}` : ''}
                    </td>
                    <td className="px-4 py-4 text-sm hidden lg:table-cell">
                      <span className={isExpired(d) ? 'text-red-500' : 'text-gray-600'}>
                        {validityLabel(d)}{isExpired(d) ? ' (expirado)' : ''}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => toggleActive(d)}
                        className="flex items-center gap-1.5 text-xs font-medium transition-colors"
                        title={d.active ? 'Clica para desativar' : 'Clica para ativar'}
                      >
                        {d.active
                          ? <><ToggleRight className="w-5 h-5 text-brand-green" /><span className="text-brand-green hidden sm:inline">Ativo</span></>
                          : <><ToggleLeft className="w-5 h-5 text-gray-400" /><span className="text-gray-400 hidden sm:inline">Inativo</span></>
                        }
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(d)}
                          className="text-gray-400 hover:text-brand-primary transition-colors p-1.5 rounded-lg hover:bg-brand-primary/10"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(d)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                          title="Apagar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {!loading && discounts.length > 0 && (
        <p className="text-xs text-gray-400 mt-4">
          💡 O desconto aplica-se ao valor dos produtos (não aos portes). Os clientes introduzem o código no checkout.
        </p>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-brand-dark mb-2">Apagar o código {deleteConfirm.code}?</h3>
            <p className="text-sm text-gray-500 mb-6">
              As encomendas já feitas mantêm o desconto. Se só queres suspender o código, desativa-o em vez de o apagar.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm.id)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Apagar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-bold text-brand-dark">
                {modal === 'create' ? 'Novo código de desconto' : 'Editar código de desconto'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              {formError && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {formError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código *</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setField('code', e.target.value.toUpperCase().replace(/\s/g, ''))}
                  className="input font-mono uppercase"
                  placeholder="Ex: PADEL10"
                  maxLength={32}
                  autoFocus
                />
                <p className="text-xs text-gray-400 mt-1">Letras, números, - ou _ (3 a 32 caracteres).</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição <span className="text-gray-400 font-normal">(só para o backoffice)</span>
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setField('description', e.target.value)}
                  className="input"
                  placeholder="Ex: Campanha Instagram novembro"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                  <select
                    value={form.type}
                    onChange={(e) => setField('type', e.target.value as DiscountType)}
                    className="input"
                  >
                    <option value="PERCENTAGE">Percentagem (%)</option>
                    <option value="FIXED">Valor fixo (€)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor * <span className="text-gray-400 font-normal">({form.type === 'PERCENTAGE' ? '%' : '€'})</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={form.type === 'PERCENTAGE' ? 100 : undefined}
                    step="0.01"
                    value={form.value}
                    onChange={(e) => setField('value', e.target.value)}
                    className="input"
                    placeholder={form.type === 'PERCENTAGE' ? '10' : '5.00'}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Compra mínima (€)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.minOrderAmount}
                    onChange={(e) => setField('minOrderAmount', e.target.value)}
                    className="input"
                    placeholder="Sem mínimo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Máx. utilizações</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={form.maxUses}
                    onChange={(e) => setField('maxUses', e.target.value)}
                    className="input"
                    placeholder="Ilimitado"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Válido desde</label>
                  <input
                    type="date"
                    value={form.startsAt}
                    onChange={(e) => setField('startsAt', e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Válido até</label>
                  <input
                    type="date"
                    value={form.expiresAt}
                    onChange={(e) => setField('expiresAt', e.target.value)}
                    className="input"
                  />
                </div>
              </div>
              {editing && (
                <p className="text-xs text-gray-400">Já foi usado {editing.usedCount} vez{editing.usedCount !== 1 ? 'es' : ''}.</p>
              )}
            </div>

            <div className="flex gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
              <button onClick={closeModal} className="btn-secondary flex-1">
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.code.trim() || !form.value}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all duration-200 ${
                  saved
                    ? 'bg-brand-green text-brand-dark'
                    : 'bg-brand-primary text-white hover:bg-red-700 disabled:opacity-50'
                }`}
              >
                {saving && !saved && <Loader2 className="w-4 h-4 animate-spin" />}
                {saved ? <><Check className="w-4 h-4" /> Guardado!</> : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
