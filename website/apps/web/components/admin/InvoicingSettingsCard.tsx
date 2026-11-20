'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Check, Loader2, RefreshCw, ToggleLeft, ToggleRight } from 'lucide-react';
import { api } from '@/lib/api';

interface InvoicingSettings {
  enabled: boolean;
  draft: boolean;
  series: string;
  priceTableId: number | null;
  keyConfigured: boolean;
}

interface ProductSyncResult {
  total: number;
  created: number;
  updated: number;
  failed: Array<{ slug: string; name: string; error: string }>;
  stoppedReason: string | null;
}

function apiErrorMessage(err: any, fallback: string): string {
  const msg = err?.response?.data?.message;
  return typeof msg === 'string' ? msg : fallback;
}

/** Botão para criar/atualizar no Facturalusa os artigos de todos os produtos. */
function ProductSyncSection() {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<ProductSyncResult | null>(null);
  const [error, setError] = useState('');

  async function handleSync() {
    if (!window.confirm('Sincronizar todos os produtos com o Facturalusa? Gasta 1 a 2 pedidos à API por produto.')) return;
    setSyncing(true);
    setError('');
    setResult(null);
    try {
      const res = await api.post<ProductSyncResult>('/invoicing/sync-products');
      setResult(res.data);
    } catch (err: any) {
      setError(apiErrorMessage(err, 'Erro ao sincronizar os produtos.'));
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="border-t pt-4">
      <h3 className="text-sm font-semibold mb-1">Artigos no Facturalusa</h3>
      <p className="text-xs text-gray-400 mb-3">
        Cria os artigos em falta e atualiza nome, IVA, categoria e preços dos existentes (referência = slug do
        produto). O preço de custo leva o preço sem IVA.
      </p>
      <button
        type="button"
        onClick={handleSync}
        disabled={syncing}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
      >
        {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        {syncing ? 'A sincronizar…' : 'Sincronizar produtos'}
      </button>

      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      {result && (
        <div className="text-sm mt-3 space-y-1">
          <p>{result.created} criados · {result.updated} atualizados · {result.failed.length} com erro (de {result.total})</p>
          {result.stoppedReason && <p className="text-amber-700">Parou a meio: {result.stoppedReason}</p>}
          {result.failed.length > 0 && (
            <ul className="text-xs text-red-600 list-disc pl-5">
              {result.failed.map((f) => <li key={f.slug}>{f.name}: {f.error}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

const SERIES_MAX_LENGTH = 30;

/** Faturação (Facturalusa): grava à parte das restantes configurações, por endpoint de admin. */
export default function InvoicingSettingsCard() {
  const [form, setForm] = useState<InvoicingSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<InvoicingSettings>('/invoicing/settings')
      .then((res) => setForm(res.data))
      .catch(() => setError('Erro ao carregar a configuração da faturação.'));
  }, []);

  function update<K extends keyof InvoicingSettings>(key: K, value: InvoicingSettings[K]) {
    setForm((f) => (f ? { ...f, [key]: value } : f));
    setSaved(false);
  }

  async function handleSave() {
    if (!form) return;
    setSaving(true);
    setError('');
    try {
      const res = await api.patch<InvoicingSettings>('/invoicing/settings', {
        enabled: form.enabled, draft: form.draft, series: form.series, priceTableId: form.priceTableId,
      });
      setForm(res.data);
      setSaved(true);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(typeof msg === 'string' ? msg : 'Erro ao gravar a configuração da faturação.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-semibold">Faturação (Facturalusa)</h2>
        {form && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${form.keyConfigured ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
            API key configurada: {form.keyConfigured ? 'sim' : 'não'}
          </span>
        )}
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Emite a fatura-recibo automaticamente quando o pagamento é confirmado. Só são faturadas as encomendas
        pagas depois de ativar — as anteriores não.
      </p>

      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {!form ? (
        !error && <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      ) : (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => update('enabled', !form.enabled)}
            aria-pressed={form.enabled}
            className="flex items-center gap-2 text-sm font-medium"
          >
            {form.enabled
              ? <><ToggleRight className="w-5 h-5 text-brand-green" /><span className="text-brand-green">Faturação automática ativa</span></>
              : <><ToggleLeft className="w-5 h-5 text-gray-400" /><span className="text-gray-400">Faturação automática desligada</span></>}
          </button>

          <div>
            <button
              type="button"
              onClick={() => update('draft', !form.draft)}
              aria-pressed={form.draft}
              className="flex items-center gap-2 text-sm font-medium"
            >
              {form.draft
                ? <><ToggleRight className="w-5 h-5 text-brand-green" /><span className="text-brand-green">Emitir como rascunho</span></>
                : <><ToggleLeft className="w-5 h-5 text-gray-400" /><span className="text-gray-700">Emitir como rascunho</span></>}
            </button>
            <p className="text-xs text-gray-400 mt-1">
              {form.draft
                ? 'Os documentos ficam em rascunho no Facturalusa, para rever e finalizar lá (e enviar ao cliente).'
                : 'Os documentos são finalizados e o Facturalusa envia-os por email ao cliente.'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Série</label>
            <input
              className="input"
              maxLength={SERIES_MAX_LENGTH}
              placeholder="Vazio = série por omissão"
              value={form.series}
              onChange={(e) => update('series', e.target.value)}
            />
            <p className="text-xs text-gray-400 mt-1">Tem de estar comunicada à AT no Facturalusa para o tipo Factura Recibo.</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">ID da tabela de preços</label>
            <input
              className="input font-mono"
              inputMode="numeric"
              placeholder="Vazio = artigos sem preço"
              value={form.priceTableId ?? ''}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '');
                update('priceTableId', digits ? Number(digits) : null);
              }}
            />
            <p className="text-xs text-gray-400 mt-1">
              Na sincronização, o preço de cada produto vai para esta tabela do Facturalusa (com IVA); o preço de
              custo do artigo leva o valor sem IVA.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              saved ? 'bg-brand-green text-brand-dark' : 'bg-brand-primary text-white hover:bg-red-700 disabled:opacity-50'
            }`}
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saved ? <><Check className="w-4 h-4" /> Guardado!</> : 'Guardar faturação'}
          </button>

          {form.keyConfigured && <ProductSyncSection />}
        </div>
      )}
    </div>
  );
}
