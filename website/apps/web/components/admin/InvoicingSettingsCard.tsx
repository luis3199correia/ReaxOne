'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Check, Loader2, ToggleLeft, ToggleRight } from 'lucide-react';
import { api } from '@/lib/api';

interface InvoicingSettings {
  enabled: boolean;
  draft: boolean;
  series: string;
  keyConfigured: boolean;
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
        enabled: form.enabled, draft: form.draft, series: form.series,
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
        </div>
      )}
    </div>
  );
}
