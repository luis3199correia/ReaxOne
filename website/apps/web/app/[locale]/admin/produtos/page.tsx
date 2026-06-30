'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  Plus, Pencil, ToggleLeft, ToggleRight, X, Check, Loader2,
  AlertCircle, Trash2, ImagePlus, Upload, Star,
} from 'lucide-react';
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
  featured: boolean;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface AvailableImage {
  path: string;
  folder: string;
}

const EMPTY_FORM = {
  name: '',
  slug: '',
  description: '',
  price: '',
  stock: '',
  categoryId: '',
  images: [] as string[],
  active: true,
  featured: false,
};

/* ─── Image Picker Overlay ─────────────────────────────────────────────── */

function ImagePicker({
  selected,
  onToggle,
  onClose,
}: {
  selected: string[];
  onToggle: (path: string) => void;
  onClose: () => void;
}) {
  const [images, setImages] = useState<AvailableImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/images')
      .then((r) => r.json())
      .then((data) => setImages(data))
      .finally(() => setLoading(false));
  }, []);

  const [uploadError, setUploadError] = useState('');

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/images', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.path) {
        setImages((prev) => [{ path: data.path, folder: 'images/produtos' }, ...prev]);
        onToggle(data.path);
      } else {
        setUploadError(data.error ?? 'Upload falhou');
      }
    } catch {
      setUploadError('Erro de rede — tenta novamente');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  const filtered = images.filter((img) =>
    img.path.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
          <h3 className="text-lg font-bold text-brand-dark">Escolher imagem</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-3 border-b flex-shrink-0 space-y-2">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filtrar imagens..."
              className="input flex-1 text-sm py-2"
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="btn-secondary flex items-center gap-2 text-sm whitespace-nowrap"
            >
              {uploading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Upload className="w-4 h-4" />}
              Upload
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
            />
          </div>
          {uploadError && (
            <p className="text-red-500 text-xs flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {uploadError}
            </p>
          )}
        </div>

        {/* Grid */}
        <div className="overflow-y-auto p-4 flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> A carregar...
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-gray-400 py-16 text-sm">Nenhuma imagem encontrada.</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {filtered.map((img) => {
                const isSelected = selected.includes(img.path);
                return (
                  <button
                    key={img.path}
                    onClick={() => onToggle(img.path)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      isSelected
                        ? 'border-brand-primary ring-2 ring-brand-primary/30'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.path} alt="" className="w-full h-full object-cover" />
                    {isSelected && (
                      <div className="absolute inset-0 bg-brand-primary/30 flex items-center justify-center">
                        <div className="bg-brand-primary rounded-full p-1">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex-shrink-0 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {selected.length} imagem{selected.length !== 1 ? 's' : ''} selecionada{selected.length !== 1 ? 's' : ''}
          </p>
          <button onClick={onClose} className="btn-primary">
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ────────────────────────────────────────────────────────── */

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Edit / create modal
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Image picker
  const [showPicker, setShowPicker] = useState(false);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  function fetchProducts() {
    setLoading(true);
    Promise.all([
      api.get('/products?all=true'),
      api.get('/categories?all=true'),
    ])
      .then(([prodRes, catRes]) => {
        setProducts(prodRes.data);
        setCategories(catRes.data);
      })
      .catch(() => setError('Erro ao carregar produtos.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchProducts(); }, []);

  /* ── Modal helpers ── */

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setSaveError('');
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
      categoryId: p.category?.id ?? '',
      images: p.images ?? [],
      active: p.active,
      featured: p.featured ?? false,
    });
    setSaveError('');
    setModal('edit');
  }

  function closeModal() {
    setModal(null);
    setEditing(null);
    setSaving(false);
    setSaved(false);
    setSaveError('');
  }

  function handleField(key: keyof typeof EMPTY_FORM, value: string | boolean | string[]) {
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

  /* ── Image helpers ── */

  function toggleImage(path: string) {
    setForm((f) => {
      const already = f.images.includes(path);
      return {
        ...f,
        images: already ? f.images.filter((p) => p !== path) : [...f.images, path],
      };
    });
  }

  function removeImage(path: string) {
    setForm((f) => ({ ...f, images: f.images.filter((p) => p !== path) }));
  }

  /* ── Save ── */

  async function handleSave() {
    const price = parseFloat(form.price);
    const stock = parseInt(form.stock, 10);
    if (!form.name || isNaN(price) || isNaN(stock)) return;

    const payload = {
      name: form.name,
      slug: form.slug,
      description: form.description,
      price,
      stock,
      images: form.images,
      active: form.active,
      featured: form.featured,
      ...(form.categoryId ? { categoryId: form.categoryId } : {}),
    };

    setSaving(true);
    setSaveError('');
    try {
      if (modal === 'create') {
        await api.post('/products', payload);
      } else if (editing) {
        await api.patch(`/products/${editing.id}`, payload);
      }
      setSaved(true);
      setTimeout(() => {
        closeModal();
        fetchProducts();
      }, 700);
    } catch (err: any) {
      setSaveError(err?.response?.data?.message ?? 'Erro ao guardar.');
      setSaving(false);
    }
  }

  /* ── Toggle active ── */

  async function toggleActive(p: Product) {
    setProducts((prev) =>
      prev.map((x) => (x.id === p.id ? { ...x, active: !x.active } : x)),
    );
    try {
      await api.patch(`/products/${p.id}`, { active: !p.active });
    } catch {
      setProducts((prev) =>
        prev.map((x) => (x.id === p.id ? { ...x, active: p.active } : x)),
      );
    }
  }

  /* ── Toggle featured ── */

  async function toggleFeatured(p: Product) {
    setProducts((prev) =>
      prev.map((x) => (x.id === p.id ? { ...x, featured: !x.featured } : x)),
    );
    try {
      await api.patch(`/products/${p.id}`, { featured: !p.featured });
    } catch {
      setProducts((prev) =>
        prev.map((x) => (x.id === p.id ? { ...x, featured: p.featured } : x)),
      );
    }
  }

  /* ── Delete ── */

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await api.delete(`/products/${deleteTarget.id}`);
      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err: any) {
      setDeleteError(err?.response?.data?.message ?? 'Erro ao apagar o produto.');
    } finally {
      setDeleting(false);
    }
  }

  /* ─────────────────────────────────────────────────────────────────────── */

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

      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-6 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-20 text-brand-muted">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          A carregar...
        </div>
      )}

      {/* Table */}
      {!loading && (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Produto</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Categoria</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Preço</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Stock</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide" title="Destaque na página inicial">⭐</th>
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
                      <span className={`text-sm font-medium ${
                        p.stock === 0 ? 'text-red-500' : p.stock < 10 ? 'text-yellow-600' : 'text-gray-700'
                      }`}>
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
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleFeatured(p)}
                        title={p.featured ? 'Em destaque — clica para remover' : 'Clica para colocar em destaque'}
                        className="p-1.5 rounded-lg transition-colors hover:bg-yellow-50"
                      >
                        <Star
                          className={`w-4 h-4 transition-colors ${
                            p.featured ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 hover:text-yellow-300'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(p)}
                          className="text-gray-400 hover:text-brand-primary transition-colors p-1.5 rounded-lg hover:bg-brand-primary/10"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setDeleteTarget(p); setDeleteError(''); }}
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

      {/* ── Delete confirmation modal ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h2 className="text-base font-bold text-brand-dark">Apagar produto?</h2>
                <p className="text-sm text-gray-500">{deleteTarget.name}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              Esta ação é irreversível. Se o produto tiver encomendas associadas, não poderá ser apagado.
            </p>
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
                onClick={confirmDelete}
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

      {/* ── Edit / Create modal ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
              <h2 className="text-lg font-bold text-brand-dark">
                {modal === 'create' ? 'Novo produto' : 'Editar produto'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-700">
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
                    value={form.categoryId}
                    onChange={(e) => handleField('categoryId', e.target.value)}
                    className="input"
                  >
                    <option value="">— Sem categoria —</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
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

                {/* ── Imagens ── */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Imagens</label>
                  <div className="flex flex-wrap gap-2">
                    {form.images.map((src, idx) => (
                      <div key={src} className="relative w-20 h-20 rounded-lg overflow-hidden bg-brand-light group flex-shrink-0">
                        <Image src={src} alt="" fill className="object-cover" sizes="80px" />
                        <button
                          onClick={() => removeImage(src)}
                          className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                        <span className="absolute bottom-1 left-1 text-[10px] font-bold bg-black/50 text-white rounded px-1">
                          {idx + 1}
                        </span>
                      </div>
                    ))}

                    <button
                      onClick={() => setShowPicker(true)}
                      className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-brand-primary hover:text-brand-primary transition-colors gap-1 flex-shrink-0"
                    >
                      <ImagePlus className="w-5 h-5" />
                      <span className="text-[10px] font-medium">Adicionar</span>
                    </button>
                  </div>
                  {form.images.length === 0 && (
                    <p className="text-xs text-gray-400 mt-1">A primeira imagem é usada como capa na loja.</p>
                  )}
                </div>

                <div className="col-span-2 space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.active}
                      onChange={(e) => handleField('active', e.target.checked)}
                      className="w-4 h-4 rounded accent-brand-primary"
                    />
                    <span className="text-sm font-medium text-gray-700">Produto ativo (visível na loja)</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.featured}
                      onChange={(e) => handleField('featured', e.target.checked)}
                      className="w-4 h-4 rounded accent-yellow-400"
                    />
                    <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      Destaque na página inicial
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 px-6 py-4 border-t bg-gray-50 rounded-b-2xl flex-shrink-0">
              {saveError && (
                <div className="flex items-start gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {saveError}
                </div>
              )}
              <div className="flex gap-3">
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
        </div>
      )}

      {/* ── Image Picker overlay ── */}
      {showPicker && (
        <ImagePicker
          selected={form.images}
          onToggle={toggleImage}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}
