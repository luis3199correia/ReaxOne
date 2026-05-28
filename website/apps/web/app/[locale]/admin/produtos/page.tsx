'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Plus, Pencil, ToggleLeft, ToggleRight, X, Check, Loader2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  category?: { id: string; name: string; slug: string };
  images: string[];
  active: boolean;
}

const CATEGORIES = ['Acessórios', 'Roupa'];

const EMPTY_FORM = {
  name: '',
  slug: '',
  description: '',
  price: '',
  stock: '',
  category: 'Acessórios',
  images: '',
  active: true,
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function fetchProducts() {
    setLoading(true);
    api.get('/products?all=true')
      .then((res) => setProducts(res.data))
      .catch(() => setError('Erro ao carregar produtos.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchProducts(); }, []);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModal('create');
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      name: p.name,
      slug: p.slug,
      description: p.description ?? '',
      price: String(p.price),
      stock: String(p.stock),
      category: p.category?.name ?? 'Acessórios',
      images: p.images.join(', '),
      active: p.active,
    });
    setModal('edit');
  }

  function closeModal() {
    setModal(null);
    setEditing(null);
  }

  function handleField(key: keyof typeof EMPTY_FORM, value: string | boolean) {
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === 'name' && typeof value === 'string' && modal === 'create') {
        next.slug = value
          .toLowerCase()
          .normalize('NFD')
          .replace(/[̀-ͯ]/g, '')
          .replace(/[^a-z0-9\s-]/g, '')
          .trim()
          .replace(/\s+/g, '-');
      }
      return next;
    });
  }

  async function handleSave() {
    const price = parseFloat(form.price);
    const stock = parseInt(form.stock, 10);
    if (!form.name || isNaN(price) || isNaN(stock)) return;

    const images = form.images.split(',').map((s) => s.trim()).filter(Boolean);
    const payload = {
      name: form.name,
      slug: form.slug,
      description: form.description,
      price,
      stock,
      images,
      active: form.active,
    };

    setSaving(true);
    try {
      if (modal === 'create') {
        await api.post('/products', payload);
      } else if (editing) {
        await api.patch(`/products/${editing.id}`, payload);
      }
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        closeModal();
        fetchProducts(); // recarrega lista da API
      }, 800);
    } catch {
      setSaving(false);
    }
  }

  async function toggleActive(p: Product) {
    // Optimistic update
    setProducts((prev) =>
      prev.map((x) => (x.id === p.id ? { ...x, active: !x.active } : x))
    );
    try {
      await api.patch(`/products/${p.id}`, { active: !p.active });
    } catch {
      // Reverter se falhar
      setProducts((prev) =>
        prev.map((x) => (x.id === p.id ? { ...x, active: p.active } : x))
      );
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">Produtos</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? '...' : `${products.length} produto${products.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Novo produto
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-6 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
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
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Produto</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Categoria</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Preço</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Stock</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-400 text-sm">
                    Nenhum produto. Clica em "Novo produto" para começar.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-brand-light flex-shrink-0">
                          {p.images[0] && (
                            <Image src={p.images[0]} alt={p.name} fill className="object-cover" sizes="40px" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-brand-dark leading-tight">{p.name}</p>
                          <p className="text-xs text-gray-400">{p.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">
                      {p.category?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-brand-dark">
                      €{p.price.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`text-sm font-medium ${p.stock === 0 ? 'text-red-500' : p.stock < 10 ? 'text-yellow-600' : 'text-gray-700'}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(p)}
                        className="flex items-center gap-1.5 text-xs font-medium transition-colors"
                        title={p.active ? 'Clica para desativar' : 'Clica para ativar'}
                      >
                        {p.active
                          ? <><ToggleRight className="w-5 h-5 text-brand-green" /><span className="text-brand-green hidden sm:inline">Ativo</span></>
                          : <><ToggleLeft className="w-5 h-5 text-gray-400" /><span className="text-gray-400 hidden sm:inline">Inativo</span></>
                        }
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openEdit(p)}
                        className="text-gray-400 hover:text-brand-primary transition-colors p-1 rounded-lg hover:bg-brand-primary/10"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-bold text-brand-dark">
                {modal === 'create' ? 'Novo produto' : 'Editar produto'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-5 flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => handleField('name', e.target.value)}
                    className="input"
                    placeholder="Bola de Reação Verde"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL)</label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => handleField('slug', e.target.value)}
                    className="input text-sm font-mono"
                    placeholder="bola-reacao-verde"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                  <select
                    value={form.category}
                    onChange={(e) => handleField('category', e.target.value)}
                    className="input"
                  >
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preço (€) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price}
                    onChange={(e) => handleField('price', e.target.value)}
                    className="input"
                    placeholder="14.99"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
                  <input
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={(e) => handleField('stock', e.target.value)}
                    className="input"
                    placeholder="50"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => handleField('description', e.target.value)}
                    className="input resize-none"
                    placeholder="Descrição do produto..."
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Imagens <span className="text-gray-400 font-normal">(caminhos separados por vírgula)</span>
                  </label>
                  <input
                    type="text"
                    value={form.images}
                    onChange={(e) => handleField('images', e.target.value)}
                    className="input text-sm"
                    placeholder="/images/produtos/bola-reacao-verde-splash.jpg"
                  />
                </div>
                <div className="col-span-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.active}
                      onChange={(e) => handleField('active', e.target.checked)}
                      className="w-4 h-4 rounded accent-brand-primary"
                    />
                    <span className="text-sm font-medium text-gray-700">Produto ativo (visível na loja)</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
              <button onClick={closeModal} className="btn-secondary flex-1">
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all duration-200 ${
                  saved
                    ? 'bg-brand-green text-brand-dark'
                    : 'bg-brand-primary text-white hover:bg-red-700'
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
