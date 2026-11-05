'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from '@/i18n/navigation';
import { Loader2, Truck, Check, Calculator, AlertTriangle, Phone, BookOpen, MapPin, Tag, X } from 'lucide-react';
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
import { whatsappUrl, formatWhatsappDisplay, getFreeShippingThresholds } from '@/lib/settings';
import { useSettings } from '@/components/providers/SettingsProvider';
import { PICKUP_METHOD_ID, PICKUP_PLACE } from '@/lib/pickup';
import PickupInfo from '@/components/shop/PickupInfo';
import GiftPicker from '@/components/checkout/GiftPicker';
import {
  GiftSelection,
  giftLabel,
  giftStatus,
  selectedCount,
  useCurrentPromotion,
} from '@/lib/giftPromotion';
import { PaymentAction, useApplePayAvailable, useOnlineMethods } from '@/lib/payments';

const NOTES_MAX_LENGTH = 500;

type PaymentMethod = 'mbway' | 'multibanco' | 'card' | 'applepay' | 'googlepay' | 'transfer' | 'cash';
type DeliveryMode = 'ship' | 'pickup';

const PAYMENT_METHOD_API: Record<PaymentMethod, string> = {
  mbway:      'MBWAY',
  multibanco: 'MULTIBANCO',
  card:       'CARD',
  applepay:   'APPLE_PAY',
  googlepay:  'GOOGLE_PAY',
  transfer:   'BANK_TRANSFER',
  cash:       'CASH',
};

interface AppliedDiscount {
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
}

/** Mesmo cálculo do servidor: só sobre os produtos e nunca acima do subtotal. */
function discountAmountFor(discount: AppliedDiscount, subtotal: number) {
  const raw = discount.type === 'PERCENTAGE' ? (subtotal * discount.value) / 100 : discount.value;
  return Math.round(Math.min(Math.max(raw, 0), subtotal) * 100) / 100;
}

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
  notes?: string;
}

/* ── Postal code format by country ─────────────────────────────────────── */
const POSTAL_FORMATS: Record<string, { placeholder: string; pattern: RegExp; hint: string }> = {
  PT: { placeholder: '0000-000', pattern: /^\d{4}-?\d{3}$/,  hint: '0000-000' },
  ES: { placeholder: '00000',   pattern: /^\d{5}$/,           hint: '00000' },
  AT: { placeholder: '0000',    pattern: /^\d{4}$/,           hint: '0000' },
  BE: { placeholder: '0000',    pattern: /^\d{4}$/,           hint: '0000' },
  CZ: { placeholder: '000 00',  pattern: /^\d{3}\s?\d{2}$/,  hint: '000 00' },
  DK: { placeholder: '0000',    pattern: /^\d{4}$/,           hint: '0000' },
  EE: { placeholder: '00000',   pattern: /^\d{5}$/,           hint: '00000' },
  FI: { placeholder: '00000',   pattern: /^\d{5}$/,           hint: '00000' },
  FR: { placeholder: '00000',   pattern: /^\d{5}$/,           hint: '00000' },
  DE: { placeholder: '00000',   pattern: /^\d{5}$/,           hint: '00000' },
  GR: { placeholder: '000 00',  pattern: /^\d{3}\s?\d{2}$/,  hint: '000 00' },
  HU: { placeholder: '0000',    pattern: /^\d{4}$/,           hint: '0000' },
  IE: { placeholder: 'A65 F4E2',pattern: /^[A-Z0-9]{3}\s?[A-Z0-9]{4}$/i, hint: 'A65 F4E2' },
  IT: { placeholder: '00000',   pattern: /^\d{5}$/,           hint: '00000' },
  LV: { placeholder: 'LV-0000', pattern: /^(LV-)?\d{4}$/i,   hint: 'LV-0000' },
  LT: { placeholder: '00000',   pattern: /^\d{5}$/,           hint: '00000' },
  MT: { placeholder: 'ABC 1234',pattern: /^[A-Z]{3}\s?\d{4}$/i, hint: 'ABC 1234' },
  NL: { placeholder: '0000 AA', pattern: /^\d{4}\s?[A-Z]{2}$/i, hint: '0000 AA' },
  PL: { placeholder: '00-000',  pattern: /^\d{2}-?\d{3}$/,   hint: '00-000' },
  SI: { placeholder: '0000',    pattern: /^\d{4}$/,           hint: '0000' },
  SK: { placeholder: '000 00',  pattern: /^\d{3}\s?\d{2}$/,  hint: '000 00' },
  SE: { placeholder: '000 00',  pattern: /^\d{3}\s?\d{2}$/,  hint: '000 00' },
};

function getPostalFormat(country: string) {
  return POSTAL_FORMATS[country] ?? { placeholder: '00000', pattern: /^.{3,}$/, hint: '' };
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
  const tGift = useTranslations('gift');
  const locale = useLocale();
  const router = useRouter();
  const settings = useSettings();
  const { items, total, clearCart } = useCartStore();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mbway');
  const [mbwayPhone, setMbwayPhone] = useState('');
  const onlineMethods = useOnlineMethods();
  const applePayAvailable = useApplePayAvailable();
  const [wantsInvoice, setWantsInvoice] = useState(false);
  const [differentAddress, setDifferentAddress] = useState(false);

  // Envio
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('ship');
  const [selectedShippingId, setSelectedShippingId] = useState<string | null>(null);
  const [shippingZone, setShippingZone] = useState<ShippingZone | null>(null);
  const [shippingCalculated, setShippingCalculated] = useState(false);

  // País (controlado fora do react-hook-form para reagir aos dropdowns)
  const [country, setCountry] = useState('PT');
  const [shipCountry, setShipCountry] = useState('PT');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Código de desconto (o valor final é sempre recalculado pelo servidor)
  const [discountInput, setDiscountInput] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(null);
  const [discountError, setDiscountError] = useState('');
  const [discountLoading, setDiscountLoading] = useState(false);

  // Oferta automática: o cliente escolhe obrigatoriamente a cor de cada oferta
  const { promotion } = useCurrentPromotion();
  const [giftSelection, setGiftSelection] = useState<GiftSelection>({});
  const [showGiftError, setShowGiftError] = useState(false);
  const gift = promotion && promotion.gifts.length > 0 ? giftStatus(promotion, items) : null;
  const giftsEligible = gift?.eligible ?? 0;
  const giftsChosen = selectedCount(giftSelection);
  const giftsIncomplete = giftsEligible > 0 && giftsChosen !== giftsEligible;

  // Se o carrinho diminuir, as escolhas a mais deixam de ser válidas
  useEffect(() => {
    if (giftsChosen > giftsEligible) setGiftSelection({});
  }, [giftsChosen, giftsEligible]);

  // Se o carrinho mudar, o código tem de ser revalidado (ex.: compra mínima)
  useEffect(() => {
    setAppliedDiscount(null);
  }, [total]);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<CheckoutForm>({
    defaultValues: { country: 'PT', shipCountry: 'PT' },
  });

  const postalCode     = watch('postalCode')     ?? '';
  const shipPostalCode = watch('shipPostalCode') ?? '';

  // País e zip usados para calcular portes
  const activeCountry = differentAddress ? shipCountry : country;
  const activeZip     = differentAddress ? shipPostalCode : postalCode;
  const canCalculate  = !!activeCountry && activeZip.replace(/\D/g, '').length >= 4;

  // As opções são sempre derivadas da zona, do subtotal atual e dos limites de
  // portes grátis por zona (backoffice) — nunca ficam com valores desatualizados.
  const shippingOptions: ShippingOption[] = useMemo(
    () => (shippingZone ? getShippingOptions(shippingZone, total, getFreeShippingThresholds(settings)) : []),
    [shippingZone, total, settings],
  );
  const selectedShipping = shippingOptions.find((o) => o.id === selectedShippingId) ?? shippingOptions[0] ?? null;

  /* ── Calcular portes ── */
  function calculateShipping() {
    setShippingZone(detectZone(activeCountry, activeZip));
    setSelectedShippingId(null);
    setShippingCalculated(true);
  }

  // Resetar portes quando morada muda
  function resetShipping() {
    setSelectedShippingId(null);
    setShippingZone(null);
    setShippingCalculated(false);
  }

  function changeDeliveryMode(mode: DeliveryMode) {
    setDeliveryMode(mode);
    // No levantamento não há morada de entrega
    if (mode === 'pickup') setDifferentAddress(false);
    // Pagamento em mão só existe com levantamento
    if (mode === 'ship' && paymentMethod === 'cash') setPaymentMethod('mbway');
  }

  // Detetar se todos os itens são ebooks (entrega digital, sem portes)
  const isAllEbooks = items.length > 0 && items.every((i) => i.isEbook);
  const isPickup    = !isAllEbooks && deliveryMode === 'pickup';

  // MB WAY está sempre disponível (automático com IfthenPay, manual sem ela)
  const paymentOptions = useMemo<PaymentMethod[]>(() => [
    'mbway',
    ...(onlineMethods.MULTIBANCO ? (['multibanco'] as const) : []),
    ...(onlineMethods.CARD ? (['card'] as const) : []),
    ...(onlineMethods.APPLE_PAY && applePayAvailable ? (['applepay'] as const) : []),
    ...(onlineMethods.GOOGLE_PAY ? (['googlepay'] as const) : []),
    'transfer',
    ...(isPickup ? (['cash'] as const) : []),
  ], [onlineMethods, applePayAvailable, isPickup]);
  const needsShippingQuote = !isAllEbooks && !isPickup;

  const shippingCost   = needsShippingQuote ? (selectedShipping?.price ?? 0) : 0;
  const discountAmount = appliedDiscount ? discountAmountFor(appliedDiscount, total) : 0;
  const orderTotal     = Math.max(total - discountAmount, 0) + shippingCost;

  /* ── Código de desconto ── */
  async function applyDiscount() {
    const code = discountInput.trim().toUpperCase();
    if (!code) return;
    setDiscountLoading(true);
    setDiscountError('');
    try {
      const res = await api.post('/discounts/validate', { code, subtotal: total });
      setAppliedDiscount({ code: res.data.code, type: res.data.type, value: Number(res.data.value) });
      setDiscountInput('');
    } catch (err: any) {
      setDiscountError(err.response?.data?.message || t('discount_invalid'));
    } finally {
      setDiscountLoading(false);
    }
  }

  function removeDiscount() {
    setAppliedDiscount(null);
    setDiscountError('');
  }

  /* ── Submit ── */
  const onSubmit = async (data: CheckoutForm) => {
    if (needsShippingQuote && !shippingCalculated) {
      setError('Calcula os portes antes de finalizar a encomenda.');
      return;
    }
    if (needsShippingQuote && (shippingZone === 'PT_ILHAS' || shippingZone === 'BLOCKED' || !selectedShipping)) {
      setError('Não é possível enviar para esta localização. Entra em contacto connosco.');
      return;
    }
    if (paymentMethod === 'cash' && !isPickup) {
      setError('O pagamento em mão só está disponível com levantamento da encomenda.');
      return;
    }
    if (giftsIncomplete) {
      setShowGiftError(true);
      setError(tGift('must_choose'));
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
        paymentMethod: PAYMENT_METHOD_API[paymentMethod],
        mbwayPhone:    paymentMethod === 'mbway' && onlineMethods.MBWAY ? (mbwayPhone.trim() || data.phone) : undefined,
        locale,
        wantsInvoice,
        nif:            data.nif,
        companyName:    data.companyName,
        shippingMethod: isAllEbooks ? 'digital' : isPickup ? PICKUP_METHOD_ID : selectedShipping!.id,
        discountCode:   appliedDiscount?.code,
        notes:          data.notes?.trim() || undefined,
        gifts: Object.entries(giftSelection).map(([productId, quantity]) => ({ productId, quantity })),
        items: items.map((i) => ({
          productId: i.id,
          name:      i.name,
          price:     i.price,
          quantity:  i.quantity,
          size:      i.size,
        })),
      });
      const action: PaymentAction | null = res.data.paymentAction ?? null;
      // Cartão / Apple Pay: o carrinho só é limpo quando o pagamento for concluído
      if (action?.type === 'redirect') {
        window.location.assign(action.url);
        return;
      }
      clearCart();
      // Total calculado pelo servidor (fonte de verdade para os portes)
      const serverTotal = Number(res.data.totalAmount);
      const params = new URLSearchParams({
        order:  res.data.id,
        total:  (Number.isFinite(serverTotal) ? serverTotal : orderTotal).toFixed(2),
        method: paymentMethod,
        email:  data.email,
        ...(isPickup ? { delivery: 'pickup' } : {}),
        ...(action?.type === 'mbway' ? { auto: '1', phone: action.phone } : {}),
        ...(action?.type === 'multibanco'
          ? { entity: action.entity, ref: action.reference, ...(action.expiresAt ? { expires: action.expiresAt } : {}) }
          : {}),
      });
      router.push({ pathname: '/checkout/confirmacao', query: Object.fromEntries(params) });
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
                      validate: (v) => getPostalFormat(country).pattern.test(v.trim()) || `Formato inválido (ex: ${getPostalFormat(country).hint})`,
                      onChange: () => !differentAddress && resetShipping(),
                    })}
                    className={`input ${errors.postalCode ? 'border-red-400' : ''}`}
                    placeholder={getPostalFormat(country).placeholder}
                  />
                  {errors.postalCode && <p className="text-red-500 text-xs mt-1">{errors.postalCode.message as string}</p>}
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
              {!isPickup && (
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
              )}
            </div>

            {/* ── Morada de entrega alternativa ── */}
            {differentAddress && !isPickup && (
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
                        validate: (v) => !differentAddress || getPostalFormat(shipCountry).pattern.test((v ?? '').trim()) || `Formato inválido (ex: ${getPostalFormat(shipCountry).hint})`,
                        onChange: () => resetShipping(),
                      })}
                      className={`input ${errors.shipPostalCode ? 'border-red-400' : ''}`}
                      placeholder={getPostalFormat(shipCountry).placeholder}
                    />
                    {errors.shipPostalCode && <p className="text-red-500 text-xs mt-1">{errors.shipPostalCode.message as string}</p>}
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

            {/* ── Portes de envio / Entrega digital ── */}
            {isAllEbooks ? (
              <div className="card p-6 border-l-4 border-brand-green">
                <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-brand-green" />
                  Entrega digital
                </h2>
                <p className="text-sm text-gray-600">
                  A tua compra é um produto digital. <strong>Não há portes de envio.</strong>
                  <br />
                  Receberás o ebook no teu email assim que o pagamento for confirmado.
                </p>
              </div>
            ) : (
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5 text-brand-primary" />
                Entrega
              </h2>

              {/* Envio por transportadora ou levantamento */}
              <div className="grid sm:grid-cols-2 gap-3 mb-5">
                {([
                  { mode: 'ship', icon: Truck, title: 'Envio por transportadora', hint: 'Portes calculados pela morada' },
                  { mode: 'pickup', icon: MapPin, title: 'Levantamento', hint: `${PICKUP_PLACE}, Rio de Mouro · sem portes` },
                ] as const).map(({ mode, icon: Icon, title, hint }) => (
                  <label
                    key={mode}
                    className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      deliveryMode === mode ? 'border-brand-primary bg-red-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="deliveryMode"
                      checked={deliveryMode === mode}
                      onChange={() => changeDeliveryMode(mode)}
                      className="accent-brand-primary mt-1"
                    />
                    <div>
                      <p className="font-medium text-sm flex items-center gap-1.5"><Icon className="w-4 h-4" /> {title}</p>
                      <p className="text-xs text-gray-500">{hint}</p>
                    </div>
                  </label>
                ))}
              </div>

              {isPickup && <PickupInfo />}

              {/* Botão calcular */}
              {!isPickup && !shippingCalculated && (
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
              {!isPickup && shippingCalculated && (
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
                          href={settings.whatsappEnabled ? whatsappUrl(settings.whatsappNumber) : `mailto:${settings.contactEmail}`}
                          target={settings.whatsappEnabled ? '_blank' : undefined}
                          rel={settings.whatsappEnabled ? 'noopener noreferrer' : undefined}
                          className="inline-flex items-center gap-1.5 mt-2 text-sm font-semibold text-amber-800 hover:underline"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          {settings.whatsappEnabled ? formatWhatsappDisplay(settings.whatsappNumber) : settings.contactEmail}
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
                          href={settings.whatsappEnabled ? whatsappUrl(settings.whatsappNumber) : `mailto:${settings.contactEmail}`}
                          target={settings.whatsappEnabled ? '_blank' : undefined}
                          rel={settings.whatsappEnabled ? 'noopener noreferrer' : undefined}
                          className="inline-flex items-center gap-1.5 mt-2 text-sm font-semibold text-red-800 hover:underline"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          {settings.whatsappEnabled ? formatWhatsappDisplay(settings.whatsappNumber) : settings.contactEmail}
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
                              onChange={() => setSelectedShippingId(opt.id)}
                              className="accent-brand-primary"
                            />
                            <div>
                              <p className="font-medium text-sm">{opt.name}</p>
                              <p className="text-xs text-gray-500">{opt.deliveryDays} dia{opt.deliveryDays !== '1' ? 's' : ''} útil{opt.deliveryDays !== '1' ? 'eis' : ''} · IVA incluído</p>
                            </div>
                          </div>
                          <span className="font-bold text-brand-dark whitespace-nowrap">
                            {opt.price === 0
                              ? <span className="text-brand-green">Grátis</span>
                              : `€${opt.price.toFixed(2)}`}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
            )}

            {/* ── Oferta automática ── */}
            {promotion && gift && (giftsEligible > 0 || gift.missingUnits > 0) && (
              <GiftPicker
                promotion={promotion}
                eligible={giftsEligible}
                missingUnits={gift.missingUnits}
                selection={giftSelection}
                onChange={(next) => { setGiftSelection(next); setShowGiftError(false); }}
                showError={showGiftError}
              />
            )}

            {/* ── Pagamento ── */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4">{t('payment')}</h2>
              <div className="space-y-3 mb-6">
                {paymentOptions.map((option) => (
                  <label
                    key={option}
                    className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-colors ${paymentMethod === option ? 'border-brand-primary bg-red-50' : 'border-gray-200'}`}
                  >
                    <input type="radio" value={option} checked={paymentMethod === option} onChange={() => setPaymentMethod(option)} className="accent-brand-primary" />
                    <span className="font-medium">{t(`payment_${option}`)}</span>
                  </label>
                ))}
              </div>
              {paymentMethod === 'mbway' && onlineMethods.MBWAY ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 space-y-3">
                  <p>{t('mbway_auto_instructions')}</p>
                  <label className="block">
                    <span className="block text-xs font-medium text-blue-900 mb-1">{t('mbway_phone_label')}</span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      value={mbwayPhone}
                      onChange={(e) => setMbwayPhone(e.target.value)}
                      placeholder={t('mbway_phone_placeholder')}
                      className="input bg-white"
                    />
                  </label>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                  {t(paymentMethod === 'mbway' ? 'mbway_instructions' : `${paymentMethod}_instructions`)}
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

            {/* ── Notas ── */}
            <div className="card p-6">
              <label htmlFor="order-notes" className="block font-medium mb-2">{t('notes_label')}</label>
              <textarea
                id="order-notes"
                {...register('notes', { maxLength: NOTES_MAX_LENGTH })}
                className="input min-h-[96px]"
                maxLength={NOTES_MAX_LENGTH}
                placeholder={t('notes_placeholder')}
              />
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
              {promotion && Object.entries(giftSelection).map(([productId, quantity]) => {
                const g = promotion.gifts.find((x) => x.productId === productId);
                if (!g) return null;
                return (
                  <div key={`gift-${productId}`} className="flex justify-between text-sm">
                    <span className="text-gray-700">🎁 {giftLabel(g, locale)} × {quantity}</span>
                    <span className="font-medium text-brand-green">{tGift('free')}</span>
                  </div>
                );
              })}
            </div>
            {/* Código de desconto */}
            <div className="border-t pt-4 mb-4">
              {appliedDiscount ? (
                <div className="flex items-center justify-between gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  <span className="flex items-center gap-2 text-sm text-green-800">
                    <Tag className="w-4 h-4" />
                    <code className="font-semibold">{appliedDiscount.code}</code>
                  </span>
                  <button
                    type="button"
                    onClick={removeDiscount}
                    className="text-green-700 hover:text-green-900"
                    aria-label={t('discount_remove')}
                    title={t('discount_remove')}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <label htmlFor="discount-code" className="block text-sm font-medium mb-1">{t('discount_code')}</label>
                  <div className="flex gap-2">
                    <input
                      id="discount-code"
                      type="text"
                      value={discountInput}
                      onChange={(e) => { setDiscountInput(e.target.value); setDiscountError(''); }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); applyDiscount(); }
                      }}
                      className={`input flex-1 min-w-0 uppercase ${discountError ? 'border-red-400' : ''}`}
                      maxLength={32}
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      onClick={applyDiscount}
                      disabled={discountLoading || !discountInput.trim()}
                      className="btn-secondary px-4 flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {discountLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('discount_apply')}
                    </button>
                  </div>
                  {discountError && <p className="text-red-500 text-xs mt-1">{discountError}</p>}
                </>
              )}
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>€{total.toFixed(2)}</span>
              </div>
              {appliedDiscount && discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-700">
                  <span>{t('discount')} ({appliedDiscount.code})</span>
                  <span>−€{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span>{isPickup ? 'Levantamento' : 'Envio'}</span>
                <span className="text-gray-400">
                  {isAllEbooks || isPickup || (shippingCalculated && selectedShipping && shippingCost === 0)
                    ? <span className="text-brand-green font-medium">Grátis</span>
                    : !shippingCalculated
                    ? <span className="italic text-xs">a calcular</span>
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
              disabled={submitting || items.length === 0 || (needsShippingQuote && (!shippingCalculated || !selectedShipping))}
              className="btn-primary w-full mt-6 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting
                ? <><Loader2 className="w-4 h-4 animate-spin" /> A processar...</>
                : <><Check className="w-4 h-4" /> {t('place_order')}</>
              }
            </button>
            {needsShippingQuote && !shippingCalculated && (
              <p className="text-xs text-gray-400 text-center mt-2">Calcula os portes para continuar</p>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
