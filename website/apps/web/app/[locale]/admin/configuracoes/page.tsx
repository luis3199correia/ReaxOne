'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, Check, AlertCircle, ToggleLeft, ToggleRight } from 'lucide-react';
import { api } from '@/lib/api';
import type { PublicSettings } from '@/lib/settings';

const EMPTY_FORM: PublicSettings = {
  whatsappNumber: '',
  whatsappEnabled: true,
  contactEmail: '',
  iban: '',
  ibanHolder: '',
};

export default function AdminSettingsPage() {
  const t = useTranslations('admin');

  const [form, setForm] = useState<PublicSettings>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/settings')
      .then((res) => setForm(res.data))
      .catch(() => setError('Erro ao carregar configurações.'))
      .finally(() => setLoading(false));
  }, []);

  function update<K extends keyof PublicSettings>(key: K, value: PublicSettings[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const res = await api.patch('/settings', form);
      setForm(res.data);
      setSaved(true);
    } catch {
      setError('Erro ao gravar configurações.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-brand-muted">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        A carregar...
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-dark mb-8">{t('settings')}</h1>

      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-6 text-sm max-w-2xl">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="space-y-6 max-w-2xl">

        {/* Contacto */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Contacto</h2>
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => update('whatsappEnabled', !form.whatsappEnabled)}
              className="flex items-center gap-2 text-sm font-medium"
            >
              {form.whatsappEnabled
                ? <><ToggleRight className="w-5 h-5 text-brand-green" /><span className="text-brand-green">Número de contacto visível no site</span></>
                : <><ToggleLeft className="w-5 h-5 text-gray-400" /><span className="text-gray-400">Número de contacto escondido no site</span></>
              }
            </button>
            <div>
              <label className="block text-sm font-medium mb-1">Número de WhatsApp</label>
              <input
                className="input"
                placeholder="351911084422"
                value={form.whatsappNumber}
                onChange={(e) => update('whatsappNumber', e.target.value)}
                disabled={!form.whatsappEnabled}
              />
              <p className="text-xs text-gray-400 mt-1">Formato internacional, só números (ex: 351911084422).</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email de contacto</label>
              <input
                type="email"
                className="input"
                placeholder="contatos@reaxone.com"
                value={form.contactEmail}
                onChange={(e) => update('contactEmail', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Transferência Bancária */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Transferência Bancária</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">IBAN</label>
              <input
                className="input"
                placeholder="PT50 0000 0000 0000 0000 0000 0"
                value={form.iban}
                onChange={(e) => update('iban', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Titular da conta</label>
              <input
                className="input"
                placeholder="Nome do titular da conta"
                value={form.ibanHolder}
                onChange={(e) => update('ibanHolder', e.target.value)}
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
            saved
              ? 'bg-brand-green text-brand-dark'
              : 'bg-brand-primary text-white hover:bg-red-700 disabled:opacity-50'
          }`}
        >
          {saving && !saved && <Loader2 className="w-4 h-4 animate-spin" />}
          {saved ? <><Check className="w-4 h-4" /> Guardado!</> : 'Guardar configurações'}
        </button>

      </div>
    </div>
  );
}
