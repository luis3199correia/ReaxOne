'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Mail, Phone, MapPin, Check, Loader2, MessageCircle } from 'lucide-react';
import { api } from '@/lib/api';

interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const SUBJECTS = [
  'Encomenda / Pagamento',
  'Dúvida sobre produto',
  'Parceria / Clube',
  'Imprensa',
  'Outro',
];

export default function ContactPage() {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ContactForm>();
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState('');

  async function onSubmit(data: ContactForm) {
    setServerError('');
    try {
      const res = await api.post('/contact', data);
      if (res.data.ok) {
        setSent(true);
        reset();
      } else {
        setServerError(res.data.error ?? 'Erro ao enviar mensagem.');
      }
    } catch {
      setServerError('Não foi possível enviar. Tenta novamente ou contacta-nos pelo WhatsApp.');
    }
  }

  return (
    <div className="min-h-screen bg-white">

      {/* Hero */}
      <div className="bg-brand-dark text-white py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <span className="inline-block bg-brand-green text-brand-dark text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4">
            Contacto
          </span>
          <h1 className="text-4xl md:text-5xl font-black mb-3">Fala connosco</h1>
          <p className="text-gray-400 text-lg max-w-lg">
            Tens uma dúvida, encomenda ou proposta? Estamos aqui para ajudar.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-5 gap-12">

          {/* Info lateral */}
          <aside className="md:col-span-2 space-y-8">
            <div>
              <h2 className="text-lg font-bold text-brand-dark mb-5">Informações</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3 text-sm text-gray-600">
                  <Mail className="w-4 h-4 text-brand-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-brand-dark">Email</p>
                    <a href="mailto:contatos@reaxone.com" className="hover:text-brand-primary transition-colors">
                      contatos@reaxone.com
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-sm text-gray-600">
                  <Phone className="w-4 h-4 text-brand-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-brand-dark">WhatsApp</p>
                    <a
                      href="https://wa.me/351911084422"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-brand-primary transition-colors"
                    >
                      +351 911 084 422
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 text-brand-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-brand-dark">Localização</p>
                    <p>Portugal 🇵🇹</p>
                  </div>
                </div>
              </div>
            </div>

            {/* WhatsApp CTA */}
            <a
              href="https://wa.me/351911084422?text=Olá%2C%20gostaria%20de%20saber%20mais%20sobre%20os%20produtos%20ReaxOne."
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-[#25D366] text-white px-5 py-4 rounded-xl font-semibold hover:bg-[#1ebe5c] transition-colors"
            >
              <MessageCircle className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold">Resposta mais rápida?</p>
                <p className="text-xs opacity-90">Fala diretamente pelo WhatsApp</p>
              </div>
            </a>

            <div className="bg-brand-light rounded-xl p-4 text-sm text-gray-600">
              <p className="font-semibold text-brand-dark mb-1">Horário de resposta</p>
              <p>Respondemos em até 24h em dias úteis.</p>
            </div>
          </aside>

          {/* Formulário */}
          <div className="md:col-span-3">
            {sent ? (
              <div className="flex flex-col items-center justify-center text-center py-16 px-8 bg-brand-light rounded-2xl">
                <div className="w-16 h-16 rounded-full bg-brand-green flex items-center justify-center mb-4">
                  <Check className="w-8 h-8 text-brand-dark" />
                </div>
                <h3 className="text-2xl font-black text-brand-dark mb-2">Mensagem enviada!</h3>
                <p className="text-gray-500 mb-6">
                  Recebemos o teu contacto e iremos responder em breve.<br />
                  Verifica também a tua caixa de entrada — enviámos uma confirmação.
                </p>
                <button
                  onClick={() => setSent(false)}
                  className="btn-secondary"
                >
                  Enviar outra mensagem
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome *
                    </label>
                    <input
                      type="text"
                      {...register('name', { required: 'Campo obrigatório' })}
                      className={`input ${errors.name ? 'border-red-400 focus:ring-red-400' : ''}`}
                      placeholder="O teu nome"
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      {...register('email', {
                        required: 'Campo obrigatório',
                        pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email inválido' },
                      })}
                      className={`input ${errors.email ? 'border-red-400 focus:ring-red-400' : ''}`}
                      placeholder="email@exemplo.com"
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assunto *</label>
                  <select
                    {...register('subject', { required: 'Campo obrigatório' })}
                    className={`input ${errors.subject ? 'border-red-400' : ''}`}
                  >
                    <option value="">Seleciona um assunto...</option>
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem *</label>
                  <textarea
                    rows={6}
                    {...register('message', { required: 'Campo obrigatório', minLength: { value: 10, message: 'Mensagem muito curta' } })}
                    className={`input resize-none ${errors.message ? 'border-red-400 focus:ring-red-400' : ''}`}
                    placeholder="Descreve o teu pedido ou questão..."
                  />
                  {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {isSubmitting
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> A enviar...</>
                    : 'Enviar mensagem'
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
