'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

type PaymentMethod = 'mbway' | 'transfer';

interface CheckoutForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  paymentMethod: PaymentMethod;
  wantsInvoice: boolean;
  nif?: string;
  companyName?: string;
}

export default function CheckoutPage() {
  const t = useTranslations('checkout');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mbway');
  const [wantsInvoice, setWantsInvoice] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<CheckoutForm>();

  const onSubmit = async (data: CheckoutForm) => {
    // TODO: submit order to API
    console.log(data);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-brand-dark mb-8">{t('title')}</h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">

            {/* Personal info */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4">{t('personal_info')}</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('first_name')}</label>
                  <input {...register('firstName', { required: true })} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('last_name')}</label>
                  <input {...register('lastName', { required: true })} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('email')}</label>
                  <input type="email" {...register('email', { required: true })} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('phone')}</label>
                  <input type="tel" {...register('phone', { required: true })} className="input" />
                </div>
              </div>
            </div>

            {/* Shipping address */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4">{t('shipping_address')}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('address')}</label>
                  <input {...register('address', { required: true })} className="input" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('city')}</label>
                    <input {...register('city', { required: true })} className="input" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t('postal_code')}</label>
                    <input {...register('postalCode', { required: true })} className="input" placeholder="0000-000" />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4">{t('payment')}</h2>

              <div className="space-y-3 mb-6">
                <label className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-colors ${paymentMethod === 'mbway' ? 'border-brand-primary bg-red-50' : 'border-gray-200'}`}>
                  <input
                    type="radio"
                    value="mbway"
                    checked={paymentMethod === 'mbway'}
                    onChange={() => setPaymentMethod('mbway')}
                    className="accent-brand-primary"
                  />
                  <span className="font-medium">{t('payment_mbway')}</span>
                </label>
                <label className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-colors ${paymentMethod === 'transfer' ? 'border-brand-primary bg-red-50' : 'border-gray-200'}`}>
                  <input
                    type="radio"
                    value="transfer"
                    checked={paymentMethod === 'transfer'}
                    onChange={() => setPaymentMethod('transfer')}
                    className="accent-brand-primary"
                  />
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

            {/* Invoice */}
            <div className="card p-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={wantsInvoice}
                  onChange={(e) => setWantsInvoice(e.target.checked)}
                  className="w-5 h-5 accent-brand-primary"
                />
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

          {/* Order summary */}
          <div className="card p-6 h-fit sticky top-6">
            <h2 className="text-lg font-semibold mb-4">{t('order_summary')}</h2>
            {/* Items from cart store */}
            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between font-bold text-lg mb-6">
                <span>Total</span>
                <span>€0.00</span>
              </div>
              <button type="submit" className="btn-primary w-full">
                {t('place_order')}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
