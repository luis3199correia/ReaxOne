'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Loader2, Truck, Check } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { api } from '@/lib/api';

type PaymentMethod = 'mbway' | 'transfer';

interface ShippingMethod {
  id: string;
  name: string;
  price: number;
  delivery_days?: string;
}

interface CheckoutForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  // morada de entrega
  address: string;
  city: string;
  postalCode: string;
  // morada alternativa (só se differentAddress = true)
  shipAddress?: string;
  shipCity?: string;
  shipPostalCode?: string;
  wantsInvoice: boolean;
  nif?: string;
  companyName?: string;
}

export default function CheckoutPage() {
  const t = useTranslations('checkout');
  const locale = useLocale();
  const router = useRouter();
  const { items, total, clearCart } = useCartStore();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mbway');
  const [wantsInvoice, setWantsInvoice] = useState(false);
  const [differentAddress, setDifferentAddress] = useState(false);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingMethod | null>(null);
  const [loadingShipping, setLoadingShipping] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const zipcodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<CheckoutForm>();

  // Usa o código postal da morada alternativa se existir, senão o principal
  const postalCode     = watch('postalCode');
  const shipPostalCode = watch('shipPostalCode');
  const activeZip      = differentAddress ? shipPostalCode : postalCode;

  useEffect(() => {
    const zip = activeZip?.replace(/\D/g, '');
    if (zip?.length !== 7) {
      setShippingMethods([]);
      setSelectedShipping(null);
      return;
    }
    if (zipcodeTimer.current) clearTimeout(zipcodeTimer.current);
    zipcodeTimer.current = setTimeout(async () => {
      setLoadingShipping(true);
      try {
        const formatted = `${zip.slice(0, 4)}-${zip.slice(4)}`;
        const res = await api.post('/shipping/methods', { zipcode: formatted });
        const methods: ShippingMethod[] = res.data?.methods || [];
        setShippingMethods(methods);
        if (methods.length > 0) setSelectedShipping(methods[0]);
      } catch {
        setShippingMethods([{ id: 'standard', name: 'Envio Standard', price: 3.99 }]);
        setSelectedShipping({ id: 'standard', name: 'Envio Standard', price: 3.99 });
      } finally {
        setLoadingShipping(false);
      }
    }, 600);
  }, [activeZip]);

  const shippingCost = selectedShipping?.price ?? 0;
  const orderTotal   = total + shippingCost;

  const onSubmit = async (data: CheckoutForm) => {
    if (!selectedShipping && items.length > 0) {
      setError('Seleciona um método de envio.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const street     = differentAddress ? data.shipAddress!    : data.address;
      const city       = differentAddress ? data.shipCity!        : data.city;
      const postalCode = differentAddress ? data.shipPostalCode!  : data.postalCode;

      const res = await api.post('/orders', {
        firstName: data.firstName,
        lastName:  data.lastName,
        email:     data.email,
        phone:     data.phone,
        street,
        city,
        postalCode,
        paymentMethod,
        wantsInvoice,
        nif:           data.nif,
        companyName:   data.companyName,
        shippingMethod: selectedShipping?.id,
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

            {/* Dados pessoais + morada */}
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
                    {...register('postalCode', { required: true, pattern: /^\d{4}-?\d{3}$/ })}
                    className={`input ${errors.postalCode ? 'border-red-400' : ''}`}
                    placeholder="0000-000"
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
                      setShippingMethods([]);
                      setSelectedShipping(null);
                    }}
                    className="w-4 h-4 rounded accent-brand-primary"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    A morada de entrega é diferente dos dados acima
                  </span>
                </label>
              </div>
            </div>

            {/* Morada de entrega — só aparece quando o checkbox está ativo */}
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
                      {...register('shipPostalCode', { required: differentAddress, pattern: /^\d{4}-?\d{3}$/ })}
                      className={`input ${errors.shipPostalCode ? 'border-red-400' : ''}`}
                      placeholder="0000-000"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Métodos de envio */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5 text-brand-primary" />
                Envio
              </h2>
              {loadingShipping ? (
                <div className="flex items-center gap-2 text-sm text-brand-muted py-4">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  A calcular métodos de envio...
                </div>
              ) : shippingMethods.length > 0 ? (
                <div className="space-y-3">
                  {shippingMethods.map((method) => (
                    <label
                      key={method.id}
                      className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        selectedShipping?.id === method.id
                          ? 'border-brand-primary bg-red-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="shipping"
                          checked={selectedShipping?.id === method.id}
                          onChange={() => setSelectedShipping(method)}
                          className="accent-brand-primary"
                        />
                        <div>
                          <p className="font-medium text-sm">{method.name}</p>
                          {method.delivery_days && (
                            <p className="text-xs text-gray-500">{method.delivery_days} dias úteis</p>
                          )}
                        </div>
                      </div>
                      <span className="font-bold text-brand-dark">
                        {method.price === 0
                          ? <span className="text-brand-green">Grátis</span>
                          : `€${method.price.toFixed(2)}`
                        }
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 py-2">
                  Insere o código postal para ver os métodos de envio disponíveis.
                </p>
              )}
            </div>

            {/* Pagamento */}
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

            {/* Fatura */}
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

          {/* Resumo */}
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
                <span className={shippingCost === 0 ? 'text-brand-green' : ''}>
                  {loadingShipping ? '...' : shippingCost === 0 ? 'Grátis' : `€${shippingCost.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total</span>
                <span>€{orderTotal.toFixed(2)}</span>
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting || items.length === 0}
              className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
            >
              {submitting
                ? <><Loader2 className="w-4 h-4 animate-spin" /> A processar...</>
                : <><Check className="w-4 h-4" /> {t('place_order')}</>
              }
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
