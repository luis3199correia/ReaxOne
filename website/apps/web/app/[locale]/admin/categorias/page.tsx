'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, ToggleLeft, ToggleRight, Trash2, X, Check, Loader2, AlertCircle, Package } from 'lucide-react';
import { api } from '@/lib/api';

interface Category {
  id: string;
  name: string;
  slug: string;
  visible: boolean;
  _count: { products: number };
}

const EMPTY_FORM = { name: '', slug: '' };

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  function fetchCategories() {
    setLoading(true);
    api.get('/categories?all=true')
      .then((res) => setCategories(res.data))
      .catch(() => setError('Erro ao carregar categorias.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchCategories(); }, []);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModal('create');
  }

  function openEdit(c: Category) {
    setEditing(c);
    setForm({ name: c.name, slug: c.slug });
    setModal('edit');
  }

  function closeModal() {
    setModal(null);
    setEditing(null);
    setSaving(false);
    setSaved(false);
  }

  function handleName(value: string) {
    setForm((f) => ({
      name: value,
      slug: modal === 'create'
        ? value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')
        : f.slug,
    }));
  }

  async function handleSave() {
    if (!form.name.trim() || !form.slug.trim()) return;
    setSaving(true);
    try {
      if (modal === 'create') {
        await api.post('/categories', { name: form.name, slug: form.slug });
      } else if (editing) {
        await api.patch(`/categories/${editing.id}`, { name: form.name, slug: form.slug });
      }
      setSaved(true);
      setTimeout(() => { closeModal(); fetchCategories(); }, 800);
    } catch {
      setSaving(false);
    }
  }

  async function toggleVisible(c: Category) {
    // Optimistic update
    setCategories((prev) =>
      prev.map((x) => (x.id === c.id ? { ...x, visible: !x.visible } : x))
    );
    try {
      await api.patch(`/categories/${c.id}`, { visible: !c.visible });
    } catch {
      setCategories((prev) =>
        prev.map((x) => (x.id === c.id ? { ...x, visible: c.visible } : x))
      );
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.delete(`/categories/${id}`);
      setDeleteConfirm(null);
      fetchCategories();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Não é possível apagar esta categoria.');
      setDeleteConfirm(null);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">Categorias</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? '...' : `${categories.length} categoria${categories.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nova categoria
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
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nome</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Slug</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Produtos</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Visível na loja</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-400 text-sm">
                    Nenhuma categoria. Clica em "Nova categoria" para começar.
                  </td>
                </tr>
              ) : (
                categories.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <p className="text-sm font-semibold text-brand-dark">{c.name}</p>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <code className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{c.slug}</code>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Package className="w-4 h-4 text-gray-400" />
                        {c._count.products}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => toggleVisible(c)}
                        className="flex items-center gap-1.5 text-xs font-medium transition-colors"
                        title={c.visible ? 'Clica para ocultar na loja' : 'Clica para mostrar na loja'}
                      >
                        {c.visible
                          ? <><ToggleRight className="w-5 h-5 text-brand-green" /><span className="text-brand-green hidden sm:inline">Visível</span></>
                          : <><ToggleLeft className="w-5 h-5 text-gray-400" /><span className="text-gray-400 hidden sm:inline">Oculta</span></>
                        }
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(c)}
                          className="text-gray-400 hover:text-brand-primary transition-colors p-1.5 rounded-lg hover:bg-brand-primary/10"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {c._count.products === 0 && (
                          <button
                            onClick={() => setDeleteConfirm(c.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                            title="Apagar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Info */}
      {!loading && categories.length > 0 && (
        <p className="text-xs text-gray-400 mt-4">
          💡 Categorias ocultas não aparecem nos filtros da loja, mas os seus produtos continuam acessíveis por link direto.
        </p>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-brand-dark mb-2">Apagar categoria?</h3>
            <p className="text-sm text-gray-500 mb-6">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
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
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-bold text-brand-dark">
                {modal === 'create' ? 'Nova categoria' : 'Editar categoria'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleName(e.target.value)}
                  className="input"
                  placeholder="Ex: Acessórios"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug <span className="text-gray-400 font-normal">(usado no URL)</span>
                </label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  className="input font-mono text-sm"
                  placeholder="acessorios"
                />
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
              <button onClick={closeModal} className="btn-secondary flex-1">
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name.trim()}
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
