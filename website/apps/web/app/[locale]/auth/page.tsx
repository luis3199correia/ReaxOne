'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { api } from '@/lib/api';
import { Loader2 } from 'lucide-react';

interface AuthForm {
  email: string;
  password: string;
}

export default function AuthPage() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const router = useRouter();

  const [error, setError] = useState('');
  const [view, setView] = useState<'login' | 'forgot' | 'forgot-sent'>('login');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const { register, handleSubmit } = useForm<AuthForm>();

  // Redireciona se já estiver logado
  useEffect(() => {
    api.get('/auth/me')
      .then((res) => {
        const role = res.data?.role;
        router.replace(role === 'ADMIN' ? `/${locale}/admin` : `/${locale}/conta`);
      })
      .catch(() => setCheckingAuth(false));
  }, [locale, router]);

  const onSubmit = async (data: AuthForm) => {
    setError('');
    try {
      const res = await api.post('/auth/login', {
        email: data.email,
        password: data.password,
      });
      if (res.data.role === 'ADMIN') {
        router.push(`/${locale}/admin`);
      } else {
        router.push(`/${locale}/conta`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || t('error'));
    }
  };

  const handleForgot = async () => {
    if (!forgotEmail) return;
    setForgotLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: forgotEmail });
    } finally {
      setForgotLoading(false);
      setView('forgot-sent');
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="card p-8">

          {/* ── Login ── */}
          {view === 'login' && (
            <>
              <h1 className="text-2xl font-bold text-brand-dark mb-6">
                {t('login_title')}
              </h1>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('email')}</label>
                  <input
                    type="email"
                    {...register('email', { required: true })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('password')}</label>
                  <input
                    type="password"
                    {...register('password', { required: true })}
                    className="input"
                  />
                </div>
                <button type="submit" className="btn-primary w-full">
                  {t('login_button')}
                </button>
              </form>

              <button
                onClick={() => setView('forgot')}
                className="mt-4 text-sm text-brand-primary hover:underline w-full text-center block"
              >
                Esqueci a palavra-passe
              </button>
            </>
          )}

          {/* ── Forgot password ── */}
          {view === 'forgot' && (
            <>
              <h1 className="text-2xl font-bold text-brand-dark mb-2">
                Recuperar palavra-passe
              </h1>
              <p className="text-sm text-gray-500 mb-6">
                Indica o teu email e enviamos um link para definires uma nova palavra-passe.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="input"
                    placeholder="o-teu-email@exemplo.com"
                  />
                </div>
                <button
                  onClick={handleForgot}
                  disabled={forgotLoading || !forgotEmail}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {forgotLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Enviar link
                </button>
              </div>

              <button
                onClick={() => setView('login')}
                className="mt-4 text-sm text-gray-500 hover:underline w-full text-center block"
              >
                ← Voltar ao login
              </button>
            </>
          )}

          {/* ── Forgot sent ── */}
          {view === 'forgot-sent' && (
            <>
              <div className="text-center">
                <div className="w-14 h-14 bg-brand-green/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">✉️</span>
                </div>
                <h1 className="text-xl font-bold text-brand-dark mb-2">
                  Verifica o teu email
                </h1>
                <p className="text-sm text-gray-500 mb-6">
                  Se o endereço <strong>{forgotEmail}</strong> está registado,
                  enviámos um link válido durante 15 minutos.
                </p>
                <button
                  onClick={() => setView('login')}
                  className="btn-secondary w-full"
                >
                  Voltar ao login
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
