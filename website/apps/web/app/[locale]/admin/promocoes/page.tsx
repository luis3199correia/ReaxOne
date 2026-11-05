'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, ToggleLeft, ToggleRight, Trash2, X, Check, Loader2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';

interface ProductSummary {
  id: string;
  name: string;
  stock: number;
  active: boolean;
}

interface Promotion {
  id: string;
  name: string;
  active: boolean;
  startsAt: string;
  endsAt: string;
  requiredUnits: number;
  giftsPerGroup: number;
  maxGiftsPerOrder: number;
  messagePt: string | null;
  messageEn: string | null;
  triggers: Array<{ productId: string; units: number; product: ProductSummary }>;
  gifts: Array<{ productId: string; product: ProductSummary }>;
}

interface PromotionForm {
  name: string;
  startsAt: string;
  endsAt: string;
  requiredUnits: string;
  giftsPerGroup: string;
  maxGiftsPerOrder: string;
  messagePt: string;
  messageEn: string;
  triggers: Record<string, string>; // productId → unidades
  gifts: string[];
}

const EMPTY_FORM: PromotionForm = {
  name: '', startsAt: '', endsAt: '',
  requiredUnits: '2', giftsPerGroup: '1', maxGiftsPerOrder: '3',
  messagePt: '', messageEn: '', triggers: {}, gifts: [],
};

/** ISO → valor de <input type="datetime-local"> (hora local). */
function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' });
}

function statusOf(p: Promotion): { label: string; className: string } {
  const now = Date.now();
  if (Date.parse(p.endsAt) <= now) return { label: 'Terminada', className: 'bg-gray-100 text-gray-500' };
  if (!p.active) return { label: 'Desativada', className: 'bg-gray-100 text-gray-500' };
  if (Date.parse(p.startsAt) > now) return { label: 'Agendada', className: 'bg-amber-100 text-amber-700' };
  return { label: 'Em vigor', className: 'bg-green-100 text-green-700' };
}

function productLabel(p: ProductSummary) {
  return `${p.name}${p.stock <= 0 ? ' (esgotado)' : ''}${p.active ? '' : ' (inativo)'}`;
}

function toPayload(form: PromotionForm) {
  return {
    name:             form.name.trim(),
    startsAt:         form.startsAt ? new Date(form.startsAt).toISOString() : '',
    endsAt:           form.endsAt ? new Date(form.endsAt).toISOString() : '',
    requiredUnits:    Number(form.requiredUnits),
    giftsPerGroup:    Number(form.giftsPerGroup),
    maxGiftsPerOrder: Number(form.maxGiftsPerOrder),
    messagePt:        form.messagePt.trim() || null,
    messageEn:        form.messageEn.trim() || null,
    triggers: Object.entries(form.triggers).map(([productId, units]) => ({ productId, units: Number(units) })),
    gifts:    form.gifts,
  };
}

export default function AdminPromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [form, setForm] = useState<PromotionForm>(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Promotion | null>(null);

  function fetchAll() {
    setLoading(true);
    Promise.all([api.get('/promotions'), api.get('/products?all=true')])
      .then(([promoRes, productRes]) => {
        setPromotions(promoRes.data);
        setProducts(productRes.data);
      })
      .catch(() => setError('Erro ao carregar promoções.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchAll(); }, []);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setModal('create');
  }

  function openEdit(p: Promotion) {
    setEditing(p);
    setForm({
      name:             p.name,
      startsAt:         toLocalInput(p.startsAt),
      endsAt:           toLocalInput(p.endsAt),
      requiredUnits:    String(p.requiredUnits),
      giftsPerGroup:    String(p.giftsPerGroup),
      maxGiftsPerOrder: String(p.maxGiftsPerOrder),
      messagePt:        p.messagePt ?? '',
      messageEn:        p.messageEn ?? '',
      triggers:         Object.fromEntries(p.triggers.map((t) => [t.productId, String(t.units)])),
      gifts:            p.gifts.map((g) => g.productId),
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

  function setField<K extends keyof PromotionForm>(key: K, value: PromotionForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleTrigger(productId: string) {
    setForm((f) => {
      const { [productId]: current, ...rest } = f.triggers;
      return { ...f, triggers: current === undefined ? { ...rest, [productId]: '1' } : rest };
    });
  }

  function toggleGift(productId: string) {
    setForm((f) => ({
      ...f,
      gifts: f.gifts.includes(productId) ? f.gifts.filter((id) => id !== productId) : [...f.gifts, productId],
    }));
  }

  const canSave = !!form.name.trim() && !!form.startsAt && !!form.endsAt
    && Object.keys(form.triggers).length > 0 && form.gifts.length > 0;

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    setFormError('');
    try {
      if (modal === 'create') {
        await api.post('/promotions', { ...toPayload(form), active: true });
      } else if (editing) {
        await api.patch(`/promotions/${editing.id}`, toPayload(form));
      }
      setSaved(true);
      setTimeout(() => { closeModal(); fetchAll(); }, 800);
    } catch (e: any) {
      setFormError(e?.response?.data?.message ?? 'Erro ao guardar a promoção.');
      setSaving(false);
    }
  }

  async function toggleActive(p: Promotion) {
    try {
      await api.patch(`/promotions/${p.id}`, { active: !p.active });
      fetchAll();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Não foi possível alterar o estado da promoção.');
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.delete(`/promotions/${id}`);
      setDeleteConfirm(null);
      fetchAll();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Não foi possível apagar esta promoção.');
      setDeleteConfirm(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">Promoções com oferta</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Ex.: por cada 2 bolas, o cliente escolhe 1 par de meias de oferta. Só pode haver uma promoção de cada vez.
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nova promoção</span>
        </button>
      </div>

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

      {loading && (
        <div className="flex items-center justify-center py-20 text-brand-muted">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          A carregar...
        </div>
      )}

      {!loading && (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Promoção</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Regra</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Período</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ativa</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {promotions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-400 text-sm">
                    Nenhuma promoção. Clica em &quot;Nova promoção&quot; para começar.
                  </td>
                </tr>
              ) : (
                promotions.map((p) => {
                  const status = statusOf(p);
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <p className="text-sm font-semibold text-brand-dark">{p.name}</p>
                        <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-1 ${status.className}`}>{status.label}</span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 hidden md:table-cell">
                        {p.giftsPerGroup} oferta{p.giftsPerGroup !== 1 ? 's' : ''} por cada {p.requiredUnits} unidade{p.requiredUnits !== 1 ? 's' : ''}, máx. {p.maxGiftsPerOrder}
                        <p className="text-xs text-gray-400">{p.gifts.map((g) => g.product.name).join(', ')}</p>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 hidden lg:table-cell">
                        {formatDateTime(p.startsAt)} – {formatDateTime(p.endsAt)}
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => toggleActive(p)}
                          className="flex items-center gap-1.5 text-xs font-medium transition-colors"
                          title={p.active ? 'Clica para desativar' : 'Clica para ativar'}
                        >
                          {p.active
                            ? <><ToggleRight className="w-5 h-5 text-brand-green" /><span className="text-brand-green hidden sm:inline">Ativa</span></>
                            : <><ToggleLeft className="w-5 h-5 text-gray-400" /><span className="text-gray-400 hidden sm:inline">Inativa</span></>
                          }
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(p)} className="text-gray-400 hover:text-brand-primary transition-colors p-1.5 rounded-lg hover:bg-brand-primary/10" title="Editar">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteConfirm(p)} className="text-gray-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50" title="Apagar">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {!loading && (
        <p className="text-xs text-gray-400 mt-4">
          💡 A promoção começa e termina sozinha nas datas indicadas. As ofertas esgotadas deixam de aparecer ao cliente
          e recebes um email quando um produto esgota.
        </p>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-brand-dark mb-2">Apagar a promoção {deleteConfirm.name}?</h3>
            <p className="text-sm text-gray-500 mb-6">As encomendas já feitas mantêm as ofertas.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">Cancelar</button>
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

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-bold text-brand-dark">{modal === 'create' ? 'Nova promoção' : 'Editar promoção'}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto">
              {formError && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome * <span className="text-gray-400 font-normal">(só para o backoffice)</span></label>
                <input className="input" value={form.name} maxLength={100} onChange={(e) => setField('name', e.target.value)} placeholder="Ex: Black Friday 2026" autoFocus />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Início *</label>
                  <input type="datetime-local" className="input" value={form.startsAt} onChange={(e) => setField('startsAt', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fim *</label>
                  <input type="datetime-local" className="input" value={form.endsAt} onChange={(e) => setField('endsAt', e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Por cada</label>
                  <input type="number" min={1} max={100} className="input" value={form.requiredUnits} onChange={(e) => setField('requiredUnits', e.target.value)} />
                  <p className="text-xs text-gray-400 mt-1">unidades compradas</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Oferece</label>
                  <input type="number" min={1} max={100} className="input" value={form.giftsPerGroup} onChange={(e) => setField('giftsPerGroup', e.target.value)} />
                  <p className="text-xs text-gray-400 mt-1">ofertas</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Máximo</label>
                  <input type="number" min={1} max={100} className="input" value={form.maxGiftsPerOrder} onChange={(e) => setField('maxGiftsPerOrder', e.target.value)} />
                  <p className="text-xs text-gray-400 mt-1">ofertas por encomenda</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Produtos que contam para a oferta *</p>
                <p className="text-xs text-gray-400 mb-2">Indica quantas unidades conta cada produto (ex.: um pack com 2 bolas conta 2).</p>
                <div className="border rounded-lg divide-y max-h-56 overflow-y-auto">
                  {products.map((p) => {
                    const units = form.triggers[p.id];
                    const checked = units !== undefined;
                    return (
                      <div key={p.id} className="flex items-center gap-3 px-3 py-2">
                        <input type="checkbox" checked={checked} onChange={() => toggleTrigger(p.id)} className="w-4 h-4 accent-brand-primary" id={`trigger-${p.id}`} />
                        <label htmlFor={`trigger-${p.id}`} className="flex-1 text-sm cursor-pointer">{productLabel(p)}</label>
                        {checked && (
                          <input
                            type="number"
                            min={1}
                            max={20}
                            value={units}
                            onChange={(e) => setForm((f) => ({ ...f, triggers: { ...f.triggers, [p.id]: e.target.value } }))}
                            className="input w-20 py-1"
                            aria-label={`Unidades de ${p.name}`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Produtos de oferta (o cliente escolhe) *</p>
                <p className="text-xs text-gray-400 mb-2">Os que estiverem esgotados não aparecem ao cliente.</p>
                <div className="border rounded-lg divide-y max-h-56 overflow-y-auto">
                  {products.map((p) => (
                    <label key={p.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer">
                      <input type="checkbox" checked={form.gifts.includes(p.id)} onChange={() => toggleGift(p.id)} className="w-4 h-4 accent-brand-primary" />
                      <span className="flex-1 text-sm">{productLabel(p)}</span>
                      <span className="text-xs text-gray-400">stock {p.stock}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Texto para o cliente (PT)</label>
                <input className="input" maxLength={300} value={form.messagePt} onChange={(e) => setField('messagePt', e.target.value)} placeholder="Ex: Black Friday: por cada 2 bolas, 1 par de meias de oferta!" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Texto para o cliente (EN, opcional)</label>
                <input className="input" maxLength={300} value={form.messageEn} onChange={(e) => setField('messageEn', e.target.value)} placeholder="Se vazio, usa o texto PT" />
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
              <button onClick={closeModal} className="btn-secondary flex-1">Cancelar</button>
              <button
                onClick={handleSave}
                disabled={saving || !canSave}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all duration-200 ${
                  saved ? 'bg-brand-green text-brand-dark' : 'bg-brand-primary text-white hover:bg-red-700 disabled:opacity-50'
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
