'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, Check, AlertCircle, ToggleLeft, ToggleRight } from 'lucide-react';
import { api } from '@/lib/api';
import type { PublicSettings } from '@/lib/settings';
import type { OnlineMethodKeys } from '@/lib/payments';
import InvoicingSettingsCard from '@/components/admin/InvoicingSettingsCard';

const EMPTY_FORM: PublicSettings = {
  whatsappNumber: '',
  whatsappEnabled: true,
  contactEmail: '',
  iban: '',
  ibanHolder: '',
  freeShippingThreshold: 0,
  freeShippingThresholdEs: 0,
  freeShippingThresholdEu: 0,
  freeShippingStartsAt: '',
  freeShippingEndsAt: '',
  bannerEnabled: false,
  bannerMessage: '',
  bannerSubtext: '',
  bannerMessageEn: '',
  bannerSubtextEn: '',
  bannerStartsAt: '',
  bannerEndsAt: '',
  paymentMbwayEnabled: true,
  paymentMultibancoEnabled: true,
  paymentCardEnabled: true,
  paymentApplePayEnabled: true,
  paymentGooglePayEnabled: true,
  paymentTransferEnabled: true,
  paymentCashEnabled: true,
};

const BANNER_TEXT_MAX_LENGTH = 300;

type PaymentToggleField =
  | 'paymentMbwayEnabled' | 'paymentMultibancoEnabled' | 'paymentCardEnabled' | 'paymentApplePayEnabled'
  | 'paymentGooglePayEnabled' | 'paymentTransferEnabled' | 'paymentCashEnabled';

// ifthenpay: método IfthenPay cujas chaves têm de estar na API (null = método manual)
const PAYMENT_TOGGLES: { field: PaymentToggleField; label: string; ifthenpay: keyof OnlineMethodKeys | null; note?: string }[] = [
  { field: 'paymentMbwayEnabled',      label: 'MB Way',                     ifthenpay: 'MBWAY' },
  { field: 'paymentMultibancoEnabled', label: 'Multibanco (entidade e referência)', ifthenpay: 'MULTIBANCO' },
  { field: 'paymentCardEnabled',       label: 'Cartão de crédito ou débito', ifthenpay: 'CARD' },
  { field: 'paymentApplePayEnabled',   label: 'Apple Pay',                  ifthenpay: 'APPLE_PAY', note: 'Só aparece em dispositivos Apple.' },
  { field: 'paymentGooglePayEnabled',  label: 'Google Pay',                 ifthenpay: 'GOOGLE_PAY' },
  { field: 'paymentTransferEnabled',   label: 'Transferência bancária',     ifthenpay: null, note: 'Confirmação manual em Encomendas.' },
  { field: 'paymentCashEnabled',       label: 'Pagamento em mão',           ifthenpay: null, note: 'Só aparece com levantamento da encomenda.' },
];

/** Texto e cor do estado de cada método, consoante o interruptor e as chaves IfthenPay. */
function paymentStatus(enabled: boolean, ifthenpay: keyof OnlineMethodKeys | null, keys: OnlineMethodKeys | null) {
  if (!enabled) return { label: 'Desligado', className: 'bg-gray-100 text-gray-600' };
  if (!ifthenpay) return { label: 'Ativo', className: 'bg-green-100 text-green-800' };
  if (!keys) return { label: 'A verificar…', className: 'bg-gray-100 text-gray-600' };
  if (keys[ifthenpay]) return { label: 'Ativo (IfthenPay)', className: 'bg-green-100 text-green-800' };
  if (ifthenpay === 'MBWAY') return { label: 'Ativo em modo manual — faltam as chaves IfthenPay', className: 'bg-amber-100 text-amber-800' };
  return { label: 'Não aparece — faltam as chaves IfthenPay', className: 'bg-amber-100 text-amber-800' };
}

type BannerTextField = 'bannerMessage' | 'bannerSubtext' | 'bannerMessageEn' | 'bannerSubtextEn';

const BANNER_TEXT_FIELDS: { field: BannerTextField; label: string; placeholder: string }[] = [
  { field: 'bannerMessage', label: 'Mensagem (PT)', placeholder: 'Black Friday: leva 2 bolas...' },
  { field: 'bannerSubtext', label: 'Texto pequeno por baixo (PT, opcional)', placeholder: '1 par de oferta por cada 2 bolas...' },
  { field: 'bannerMessageEn', label: 'Mensagem (EN, opcional)', placeholder: 'Se vazio, usa a mensagem PT' },
  { field: 'bannerSubtextEn', label: 'Texto pequeno por baixo (EN, opcional)', placeholder: 'Se vazio, usa o texto PT' },
];

// ISO (UTC) → valor de <input type="datetime-local"> na hora local do browser
function isoToLocalInput(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function localInputToIso(value: string): string {
  return value ? new Date(value).toISOString() : '';
}

function bannerStatus(form: PublicSettings): { label: string; className: string } {
  if (!form.bannerEnabled) return { label: 'Desativado', className: 'bg-gray-100 text-gray-500' };
  const now = Date.now();
  if (form.bannerStartsAt && now < Date.parse(form.bannerStartsAt)) {
    return { label: 'Agendado', className: 'bg-amber-100 text-amber-700' };
  }
  if (form.bannerEndsAt && now >= Date.parse(form.bannerEndsAt)) {
    return { label: 'Terminado', className: 'bg-gray-100 text-gray-500' };
  }
  return { label: 'Visível agora', className: 'bg-green-100 text-green-700' };
}

type ThresholdField = 'freeShippingThreshold' | 'freeShippingThresholdEs' | 'freeShippingThresholdEu';

const FREE_SHIPPING_FIELDS: { field: ThresholdField; label: string; placeholder: string }[] = [
  { field: 'freeShippingThreshold', label: 'Portugal Continental', placeholder: '35' },
  { field: 'freeShippingThresholdEs', label: 'Espanha (continental, Baleares e Canárias)', placeholder: '50' },
  { field: 'freeShippingThresholdEu', label: 'Restantes países da UE', placeholder: '70' },
];

export default function AdminSettingsPage() {
  const t = useTranslations('admin');

  const [form, setForm] = useState<PublicSettings>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [ifthenpayKeys, setIfthenpayKeys] = useState<OnlineMethodKeys | null>(null);

  useEffect(() => {
    api.get('/settings')
      .then((res) => setForm({ ...EMPTY_FORM, ...res.data }))
      .catch(() => setError('Erro ao carregar configurações.'))
      .finally(() => setLoading(false));
    api.get<OnlineMethodKeys>('/payments/admin/keys')
      .then((res) => setIfthenpayKeys(res.data))
      .catch(() => { /* sem estado das chaves: os badges ficam "A verificar…" */ });
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
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(typeof msg === 'string' ? msg : 'Erro ao gravar configurações.');
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

        {/* Banner */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Banner no topo do site</h2>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${bannerStatus(form).className}`}>
              {bannerStatus(form).label}
            </span>
          </div>
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => update('bannerEnabled', !form.bannerEnabled)}
              className="flex items-center gap-2 text-sm font-medium"
            >
              {form.bannerEnabled
                ? <><ToggleRight className="w-5 h-5 text-brand-green" /><span className="text-brand-green">Banner ativo</span></>
                : <><ToggleLeft className="w-5 h-5 text-gray-400" /><span className="text-gray-400">Banner desativado</span></>
              }
            </button>
            {BANNER_TEXT_FIELDS.map(({ field, label, placeholder }) => (
              <div key={field}>
                <label className="block text-sm font-medium mb-1">{label}</label>
                <input
                  className="input"
                  maxLength={BANNER_TEXT_MAX_LENGTH}
                  placeholder={placeholder}
                  value={form[field]}
                  onChange={(e) => update(field, e.target.value)}
                />
              </div>
            ))}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Início (opcional)</label>
                <input
                  type="datetime-local"
                  className="input"
                  value={isoToLocalInput(form.bannerStartsAt)}
                  onChange={(e) => update('bannerStartsAt', localInputToIso(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Fim (opcional)</label>
                <input
                  type="datetime-local"
                  className="input"
                  value={isoToLocalInput(form.bannerEndsAt)}
                  onChange={(e) => update('bannerEndsAt', localInputToIso(e.target.value))}
                />
              </div>
            </div>
            <p className="text-xs text-gray-400">
              Com o banner ativo, aparece automaticamente entre o início e o fim (hora local deste computador).
              Sem datas, fica visível enquanto estiver ativo. Se a versão EN estiver vazia, o site em inglês mostra o texto PT.
            </p>

            {form.bannerMessage.trim() && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Pré-visualização</p>
                <div className="bg-brand-primary text-white text-center px-4 py-2 rounded-lg">
                  <p className="text-sm font-semibold leading-snug">{form.bannerMessage}</p>
                  {form.bannerSubtext.trim() && (
                    <p className="text-xs opacity-90 leading-snug mt-0.5">{form.bannerSubtext}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Envios */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Envios</h2>
          <p className="text-sm font-medium mb-3">Portes grátis a partir de (€)</p>
          <div className="space-y-4">
            {FREE_SHIPPING_FIELDS.map(({ field, label, placeholder }) => (
              <div key={field}>
                <label className="block text-sm mb-1">{label}</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className="input"
                  placeholder={placeholder}
                  value={form[field]}
                  onChange={(e) => update(field, e.target.value === '' ? 0 : Number(e.target.value))}
                />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-1">Portes grátis desde (opcional)</label>
              <input
                type="datetime-local"
                className="input"
                value={isoToLocalInput(form.freeShippingStartsAt)}
                onChange={(e) => update('freeShippingStartsAt', localInputToIso(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Portes grátis até (opcional)</label>
              <input
                type="datetime-local"
                className="input"
                value={isoToLocalInput(form.freeShippingEndsAt)}
                onChange={(e) => update('freeShippingEndsAt', localInputToIso(e.target.value))}
              />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Sem datas, os portes grátis estão sempre em vigor. Com datas, só se aplicam nesse período; fora dele todas as encomendas pagam portes.
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Encomendas com subtotal igual ou superior ao valor da zona não pagam portes. Use 0 para desativar.
            Açores e Madeira não têm portes grátis. Os valores aparecem automaticamente na página de produto, em Envios e nos Termos.
          </p>
        </div>

        {/* Métodos de pagamento */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-1">Métodos de pagamento</h2>
          <p className="text-sm text-gray-500 mb-4">
            Escolhe os métodos que aparecem no checkout. Os da IfthenPay só aparecem quando as chaves estão
            configuradas no servidor da API.
          </p>
          <div className="divide-y divide-gray-100">
            {PAYMENT_TOGGLES.map(({ field, label, ifthenpay, note }) => {
              const enabled = form[field];
              const status = paymentStatus(enabled, ifthenpay, ifthenpayKeys);
              return (
                <div key={field} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-brand-dark">{label}</p>
                    <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${status.className}`}>
                      {status.label}
                    </span>
                    {note && <p className="text-xs text-gray-400 mt-1">{note}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => update(field, !enabled)}
                    aria-pressed={enabled}
                    aria-label={`${enabled ? 'Desligar' : 'Ligar'} ${label}`}
                    className="flex-shrink-0"
                  >
                    {enabled
                      ? <ToggleRight className="w-8 h-8 text-brand-green" />
                      : <ToggleLeft className="w-8 h-8 text-gray-400" />}
                  </button>
                </div>
              );
            })}
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

        {/* Faturação — tem o seu próprio botão de gravar */}
        <InvoicingSettingsCard />

      </div>
    </div>
  );
}
