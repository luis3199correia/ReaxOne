'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Loader2, Truck, Check, Calculator, AlertTriangle, Phone } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { api } from '@/lib/api';
import {
  detectZone,
  getShippingOptions,
  COUNTRY_OPTIONS,
  ZONE_LABELS,
  ShippingOption,
  ShippingZone,
} from '@/lib/shippingRates';

type PaymentMethod = 'mbway' | 'transfer';

interface CheckoutForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  // Morada de faturação
  address: string;
  city: string;
  postalCode: string;
  country: string;
  // Morada de entrega alternativa
  shipAddress?: string;
  shipCity?: string;
  shipPostalCode?: string;
  shipCountry?: string;
  // Fatura
  wantsInvoice: boolean;
  nif?: string;
  companyName?: string;
}

/* ── Country Select ─────────────────────────────────────────────────────── */
function CountrySelect({ value, onChange, error }: {
  value: string;
  onChange: (v: string) => void;
  error?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`input ${error ? 'border-red-400' : ''}`}
    >
      <option value="">— Seleciona o país —</option>
      {COUNTRY_OPTIONS.map((opt) =>
        opt.disabled ? (
          <option key={opt.value} value={opt.value} disabled>{opt.label}</option>
        ) : (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        )
      )}
    </select>
  );
}

/* ── Main Page ──────────────────────────────────────────────────────────── */
export default function CheckoutPage() {
  const t = useTranslations('checkout');
  const locale = useLocale();
  const router = useRouter();
  const { items, total, clearCart } = useCartStore();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mbway');
  const [wantsInvoice, setWantsInvoice] = useState(false);
  const [differentAddress, setDifferentAddress] = useState(false);

  // Envio
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);
  const [shippingZone, setShippingZone] = useState<ShippingZone | null>(null);
  const [shippingCalculated, setShippingCalculated] = useState(false);

  // País (controlado fora do react-hook-form para reagir aos dropdowns)
  const [country, setCountry] = useState('PT');
  const [shipCountry, setShipCountry] = useState('PT');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, watch, formState: { errors } } = useForm<CheckoutForm>({
    defaultValues: { country: 'PT', shipCountry: 'PT' },
  });

  const postalCode     = watch('postalCode')     ?? '';
  const shipPostalCode = watch('shipPostalCode') ?? '';

  // País e zip usados para calcular portes
  const activeCountry = differentAddress ? shipCountry : country;
  const activeZip     = differentAddress ? shipPostalCode : postalCode;
  const canCalculate  = !!activeCountry && activeZip.replace(/\D/g, '').length >= 4;

  /* ── Calcular portes ── */
  function calculateShipping() {
    const zone = detectZone(activeCountry, activeZip);
    const opts = getShippingOptions(zone);
    setShippingZone(zone);
    setShippingOptions(opts);
    setShippingCalculated(true);
    setSelectedShipping(opts.length > 0 ? opts[0] : null);
  }

  // Resetar portes quando morada muda
  function resetShipping() {
    setShippingOptions([]);
    setSelectedShipping(null);
    setShippingZone(null);
    setShippingCalculated(false);
  }

  const shippingCost = selectedShipping?.price ?? 0;
  const orderTotal   = total + shippingCost;

  /* ── Submit ── */
  const onSubmit = async (data: CheckoutForm) => {
    if (!shippingCalculated) {
      setError('Calcula os portes antes de finalizar a encomenda.');
      return;
    }
    if (shippingZone === 'PT_ILHAS' || shippingZone === 'BLOCKED' || !selectedShipping) {
      setError('Não é possível enviar para esta localização. Entra em contacto connosco.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const street     = differentAddress ? data.shipAddress!    : data.address;
      const city       = differentAddress ? data.shipCity!       : data.city;
      const postalCode = differentAddress ? data.shipPostalCode! : data.postalCode;
      const orderCountry = differentAddress ? shipCountry : country;

      const res = await api.post('/orders', {
        firstName: data.firstName,
        lastName:  data.lastName,
        email:     data.email,
        phone:     data.phone,
        street,
        city,
        postalCode,
        country: orderCountry,
        paymentMethod,
        wantsInvoice,
        nif:            data.nif,
        companyName:    data.companyName,
        shippingMethod: selectedShipping.id,
        shippingCost,
        items: items.map((i) => ({
          productId: i.id,
          name:      i.name,
          price:     i.price,
          quantity:  i.quantity,
          size:      i.size,
        })),
      });
      clearCart();
      router.push(`/${locale}/conta?order=${res.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao criar encomenda. Tenta novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-brand-dark mb-8">{t('title')}</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">

            {/* ── Dados pessoais + morada de faturação ── */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4">{t('personal_info')}</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('first_name')} *</label>
                  <input {...register('firstName', { required: true })} className={`input ${errors.firstName ? 'border-red-400' : ''}`} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('last_name')} *</label>
                  <input {...register('lastName', { required: true })} className={`input ${errors.lastName ? 'border-red-400' : ''}`} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('email')} *</label>
                  <input type="email" {...register('email', { required: true })} className={`input ${errors.email ? 'border-red-400' : ''}`} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('phone')} *</label>
                  <input type="tel" {...register('phone', { required: true })} className={`input ${errors.phone ? 'border-red-400' : ''}`} placeholder="+351 9XX XXX XXX" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">{t('address')} *</label>
                  <input {...register('address', { required: true })} className={`input ${errors.address ? 'border-red-400' : ''}`} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('city')} *</label>
                  <input {...register('city', { required: true })} className={`input ${errors.city ? 'border-red-400' : ''}`} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('postal_code')} *</label>
                  <input
                    {...register('postalCode', {
                      required: true,
                      onChange: () => !differentAddress && resetShipping(),
                    })}
                    className={`input ${errors.postalCode ? 'border-red-400' : ''}`}
                    placeholder="0000-000"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">País *</label>
                  <CountrySelect
                    value={country}
                    onChange={(v) => { setCountry(v); if (!differentAddress) resetShipping(); }}
                    error={!country}
                  />
                </div>
              </div>

              {/* Checkbox morada de entrega diferente */}
              <div className="mt-5 pt-4 border-t border-gray-100">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={differentAddress}
                    onChange={(e) => {
                      setDifferentAddress(e.target.checked);
                      resetShipping();
                    }}
                    className="w-4 h-4 rounded accent-brand-primary"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    A morada de entrega é diferente dos dados acima
                  </span>
                </label>
              </div>
            </div>

            {/* ── Morada de entrega alternativa ── */}
            {differentAddress && (
              <div className="card p-6 border-l-4 border-brand-primary">
                <h2 className="text-lg font-semibold mb-4">Morada de entrega</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">{t('address')} *</label>
                    <input
                      {...register('shipAddress', { required: differentAddress })}
                      className={`input ${errors.shipAddress ? 'border-red-400' : ''}`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('city')} *</label>
                    <input
                      {...register('shipCity', { required: differentAddress })}
                      className={`input ${errors.shipCity ? 'border-red-400' : ''}`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('postal_code')} *</label>
                    <input
                      {...register('shipPostalCode', {
                        required: differentAddress,
                        onChange: () => resetShipping(),
                      })}
                      className={`input ${errors.shipPostalCode ? 'border-red-400' : ''}`}
                      placeholder="0000-000"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">País *</label>
                    <CountrySelect
                      value={shipCountry}
                      onChange={(v) => { setShipCountry(v); resetShipping(); }}
                      error={!shipCountry}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── Portes de envio ── */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5 text-brand-primary" />
                Envio
              </h2>

              {/* Botão calcular */}
              {!shippingCalculated && (
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-3">
                    Preenche o código postal e o país para calcular os portes.
                  </p>
                  <button
                    type="button"
                    onClick={calculateShipping}
                    disabled={!canCalculate}
                    className="flex items-center gap-2 text-sm font-semibold text-brand-primary hover:underline disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed transition-colors"
                  >
                    <Calculator className="w-4 h-4" />
                    Calcular portes
                  </button>
                </div>
              )}

              {/* Resultado do cálculo */}
              {shippingCalculated && (
                <>
                  {/* Zona detectada */}
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                      Zona: <span className="text-brand-dark">{shippingZone ? ZONE_LABELS[shippingZone] : ''}</span>
                    </p>
                    <button
                      type="button"
                      onClick={resetShipping}
                      className="text-xs text-gray-400 hover:text-gray-600 underline"
                    >
                      Alterar
                    </button>
                  </div>

                  {/* Ilhas PT — sem opções */}
                  {shippingZone === 'PT_ILHAS' && (
                    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-amber-800">Envio para as ilhas não disponível online</p>
                        <p className="text-sm text-amber-700 mt-1">
                          Para encomendas para os Açores ou Madeira, entra em contacto connosco para calcular os portes manualmente.
                        </p>
                        <a
                          href="https://wa.me/351911084422"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 mt-2 text-sm font-semibold text-amber-800 hover:underline"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          +351 911 084 422
                        </a>
                      </div>
                    </div>
                  )}

                  {/* País não suportado */}
                  {shippingZone === 'BLOCKED' && (
                    <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
                      <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-red-800">Não fazemos envios para este país</p>
                        <p className="text-sm text-red-700 mt-1">
                          De momento só enviamos para Portugal, Espanha e alguns países da Europa. Entra em contacto para saber mais.
                        </p>
                        <a
                          href="https://wa.me/351911084422"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 mt-2 text-sm font-semibold text-red-800 hover:underline"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          +351 911 084 422
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Opções de envio */}
                  {shippingOptions.length > 0 && (
                    <div className="space-y-3">
                      {shippingOptions.map((opt) => (
                        <label
                          key={opt.id}
                          className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                            selectedShipping?.id === opt.id
                              ? 'border-brand-primary bg-red-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="shipping"
                              checked={selectedShipping?.id === opt.id}
                              onChange={() => setSelectedShipping(opt)}
                              className="accent-brand-primary"
                            />
                            <div>
                              <p className="font-medium text-sm">{opt.name}</p>
                              <p className="text-xs text-gray-500">{opt.deliveryDays} dia{opt.deliveryDays !== '1' ? 's' : ''} útil{opt.deliveryDays !== '1' ? 'eis' : ''} · IVA incluído</p>
                            </div>
                          </div>
                          <span className="font-bold text-brand-dark whitespace-nowrap">
                            €{opt.price.toFixed(2)}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ── Pagamento ── */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4">{t('payment')}</h2>
              <div className="space-y-3 mb-6">
                <label className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-colors ${paymentMethod === 'mbway' ? 'border-brand-primary bg-red-50' : 'border-gray-200'}`}>
                  <input type="radio" value="mbway" checked={paymentMethod === 'mbway'} onChange={() => setPaymentMethod('mbway')} className="accent-brand-primary" />
                  <span className="font-medium">{t('payment_mbway')}</span>
                </label>
                <label className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-colors ${paymentMethod === 'transfer' ? 'border-brand-primary bg-red-50' : 'border-gray-200'}`}>
                  <input type="radio" value="transfer" checked={paymentMethod === 'transfer'} onChange={() => setPaymentMethod('transfer')} className="accent-brand-primary" />
                  <span className="font-medium">{t('payment_transfer')}</span>
                </label>
              </div>
              {paymentMethod === 'mbway' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                  {t('mbway_instructions')}
                </div>
              )}
              {paymentMethod === 'transfer' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                  {t('transfer_instructions')}
                </div>
              )}
            </div>

            {/* ── Fatura ── */}
            <div className="card p-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={wantsInvoice} onChange={(e) => setWantsInvoice(e.target.checked)} className="w-5 h-5 accent-brand-primary" />
                <span className="font-medium">{t('invoice_question')}</span>
              </label>
              {wantsInvoice && (
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('nif')}</label>
                    <input {...register('nif')} className="input" placeholder="000000000" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('company_name')}</label>
                    <input {...register('companyName')} className="input" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Resumo ── */}
          <div className="card p-6 h-fit sticky top-6">
            <h2 className="text-lg font-semibold mb-4">{t('order_summary')}</h2>
            <div className="space-y-3 mb-4">
              {items.map((item) => (
                <div key={`${item.id}-${item.size}`} className="flex justify-between text-sm">
                  <span className="text-gray-700">{item.name} × {item.quantity}</span>
                  <span className="font-medium">€{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>€{total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Envio</span>
                <span className={shippingCost === 0 ? 'text-gray-400' : ''}>
                  {!shippingCalculated
                    ? <span className="text-gray-400 italic text-xs">a calcular</span>
                    : shippingCost === 0
                    ? '—'
                    : `€${shippingCost.toFixed(2)}`
                  }
                </span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total</span>
                <span>€{orderTotal.toFixed(2)}</span>
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting || items.length === 0 || !shippingCalculated || !selectedShipping}
              className="btn-primary w-full mt-6 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting
                ? <><Loader2 className="w-4 h-4 animate-spin" /> A processar...</>
                : <><Check className="w-4 h-4" /> {t('place_order')}</>
              }
            </button>
            {!shippingCalculated && (
              <p className="text-xs text-gray-400 text-center mt-2">Calcula os portes para continuar</p>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
