'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Mail, Phone, MapPin, Check, Loader2, MessageCircle, Instagram } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import { whatsappUrl, formatWhatsappDisplay } from '@/lib/settings';
import { useSettings } from '@/components/providers/SettingsProvider';

interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export default function ContactPage() {
  const t = useTranslations('contact');
  const settings = useSettings();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ContactForm>();
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState('');

  const subjects = [
    t('subject_order'),
    t('subject_product'),
    t('subject_partnership'),
    t('subject_press'),
    t('subject_other'),
  ];

  async function onSubmit(data: ContactForm) {
    setServerError('');
    try {
      const res = await api.post('/contact', data);
      if (res.data.ok) {
        setSent(true);
        reset();
      } else {
        setServerError(res.data.error ?? t('submit'));
      }
    } catch {
      setServerError(t('whatsapp_cta_subtitle'));
    }
  }

  return (
    <div className="min-h-screen bg-white">

      {/* Hero */}
      <div className="bg-brand-dark text-white py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <span className="inline-block bg-brand-green text-brand-dark text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4">
            {t('badge')}
          </span>
          <h1 className="text-4xl md:text-5xl font-black mb-3">{t('title')}</h1>
          <p className="text-gray-400 text-lg max-w-lg">{t('subtitle')}</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-5 gap-12">

          {/* Info lateral */}
          <aside className="md:col-span-2 space-y-8">
            <div>
              <h2 className="text-lg font-bold text-brand-dark mb-5">{t('info_heading')}</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3 text-sm text-gray-600">
                  <Mail className="w-4 h-4 text-brand-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-brand-dark">Email</p>
                    <a href={`mailto:${settings.contactEmail}`} className="hover:text-brand-primary transition-colors">
                      {settings.contactEmail}
                    </a>
                  </div>
                </div>
                {settings.whatsappEnabled && (
                  <div className="flex items-start gap-3 text-sm text-gray-600">
                    <Phone className="w-4 h-4 text-brand-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-brand-dark">WhatsApp</p>
                      <a
                        href={whatsappUrl(settings.whatsappNumber)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-brand-primary transition-colors"
                      >
                        {formatWhatsappDisplay(settings.whatsappNumber)}
                      </a>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 text-brand-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-brand-dark">{t('location_label')}</p>
                    <p>Portugal 🇵🇹</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-sm text-gray-600">
                  <Instagram className="w-4 h-4 text-brand-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-brand-dark">Instagram</p>
                    <a
                      href="https://www.instagram.com/reax.one/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-brand-primary transition-colors"
                    >
                      @reax.one
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* WhatsApp CTA */}
            {settings.whatsappEnabled && (
              <a
                href={whatsappUrl(settings.whatsappNumber, 'Ol%C3%A1%2C%20gostaria%20de%20saber%20mais%20sobre%20os%20produtos%20ReaxOne.')}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-[#25D366] text-white px-5 py-4 rounded-xl font-semibold hover:bg-[#1ebe5c] transition-colors"
              >
                <MessageCircle className="w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold">{t('whatsapp_cta_title')}</p>
                  <p className="text-xs opacity-90">{t('whatsapp_cta_subtitle')}</p>
                </div>
              </a>
            )}

            <div className="bg-brand-light rounded-xl p-4 text-sm text-gray-600">
              <p className="font-semibold text-brand-dark mb-1">{t('response_time_heading')}</p>
              <p>{t('response_time_text')}</p>
            </div>
          </aside>

          {/* Formulário */}
          <div className="md:col-span-3">
            {sent ? (
              <div className="flex flex-col items-center justify-center text-center py-16 px-8 bg-brand-light rounded-2xl">
                <div className="w-16 h-16 rounded-full bg-brand-green flex items-center justify-center mb-4">
                  <Check className="w-8 h-8 text-brand-dark" />
                </div>
                <h3 className="text-2xl font-black text-brand-dark mb-2">{t('success_title')}</h3>
                <p className="text-gray-500 mb-6">
                  {t('success_p1')}<br />{t('success_p2')}
                </p>
                <button onClick={() => setSent(false)} className="btn-secondary">
                  {t('send_another')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {serverError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                    {serverError}
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('name_label')} *</label>
                    <input
                      type="text"
                      {...register('name', { required: t('required') })}
                      className={`input ${errors.name ? 'border-red-400 focus:ring-red-400' : ''}`}
                      placeholder={t('name_placeholder')}
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('email_label')} *</label>
                    <input
                      type="email"
                      {...register('email', {
                        required: t('required'),
                        pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: t('email_invalid') },
                      })}
                      className={`input ${errors.email ? 'border-red-400 focus:ring-red-400' : ''}`}
                      placeholder="email@exemplo.com"
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('subject_label')} *</label>
                  <select
                    {...register('subject', { required: t('required') })}
                    className={`input ${errors.subject ? 'border-red-400' : ''}`}
                  >
                    <option value="">{t('subject_placeholder')}</option>
                    {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('message_label')} *</label>
                  <textarea
                    rows={6}
                    {...register('message', {
                      required: t('required'),
                      minLength: { value: 10, message: t('message_too_short') },
                    })}
                    className={`input resize-none ${errors.message ? 'border-red-400 focus:ring-red-400' : ''}`}
                    placeholder={t('message_placeholder')}
                  />
                  {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {isSubmitting
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('submitting')}</>
                    : t('submit')
                  }
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
