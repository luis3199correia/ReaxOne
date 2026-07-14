'use client';

import { useLocale } from 'next-intl';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { api } from '@/lib/api';
import { Loader2, Eye, EyeOff } from 'lucide-react';

type View = 'login' | 'register' | 'forgot' | 'forgot-sent';

interface LoginForm    { email: string; password: string; }
interface RegisterForm { firstName: string; lastName: string; email: string; password: string; confirmPassword: string; }

export default function AuthPage() {
  const locale = useLocale();
  const router = useRouter();

  const [view, setView]               = useState<View>('login');
  const [error, setError]             = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showPass, setShowPass]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Forgot password
  const [forgotEmail, setForgotEmail]     = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const loginForm    = useForm<LoginForm>();
  const registerForm = useForm<RegisterForm>();

  // Redireciona se já estiver logado
  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    fetch(`${apiUrl}/auth/me`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.role) {
          router.replace(data.role === 'ADMIN' ? `/${locale}/admin` : `/${locale}/conta`);
        } else {
          setCheckingAuth(false);
        }
      })
      .catch(() => setCheckingAuth(false));
  }, [locale, router]);

  /* ── Login ── */
  const onLogin = async (data: LoginForm) => {
    setError('');
    try {
      const res = await api.post('/auth/login', data);
      router.push(res.data.role === 'ADMIN' ? `/${locale}/admin` : `/${locale}/conta`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Credenciais inválidas. Tenta novamente.');
    }
  };

  /* ── Registo ── */
  const onRegister = async (data: RegisterForm) => {
    setError('');
    if (data.password !== data.confirmPassword) {
      setError('As palavras-passe não coincidem.');
      return;
    }
    try {
      const res = await api.post('/auth/register', {
        firstName: data.firstName,
        lastName:  data.lastName,
        email:     data.email,
        password:  data.password,
      });
      router.push(res.data.role === 'ADMIN' ? `/${locale}/admin` : `/${locale}/conta`);
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setError(
        msg === 'Email já registado'
          ? 'Este email já tem conta. Faz login ou recupera a palavra-passe.'
          : msg || 'Erro ao criar conta. Tenta novamente.'
      );
    }
  };

  /* ── Forgot password ── */
  const handleForgot = async () => {
    if (!forgotEmail) return;
    setForgotLoading(true);
    try { await api.post('/auth/forgot-password', { email: forgotEmail }); } catch {}
    finally { setForgotLoading(false); setView('forgot-sent'); }
  };

  const switchView = (v: View) => { setError(''); setView(v); };

  if (checkingAuth) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="card p-8">

          {/* ── Login ── */}
          {view === 'login' && (
            <>
              <h1 className="text-2xl font-bold text-brand-dark mb-6">Entrar na conta</h1>

              {error && <ErrorBox msg={error} />}

              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                <Field label="Email">
                  <input type="email" {...loginForm.register('email', { required: true })} className="input" placeholder="email@exemplo.com" />
                </Field>
                <Field label="Palavra-passe">
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      {...loginForm.register('password', { required: true })}
                      className="input pr-10"
                    />
                    <TogglePass show={showPass} onToggle={() => setShowPass(!showPass)} />
                  </div>
                </Field>
                <button type="submit" disabled={loginForm.formState.isSubmitting} className="btn-primary w-full flex items-center justify-center gap-2">
                  {loginForm.formState.isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Entrar
                </button>
              </form>

              <div className="mt-5 pt-4 border-t border-gray-100 space-y-2 text-center text-sm">
                <button onClick={() => switchView('forgot')} className="text-brand-primary hover:underline block w-full">
                  Esqueci a palavra-passe
                </button>
                <p className="text-gray-500">
                  Ainda não tens conta?{' '}
                  <button onClick={() => switchView('register')} className="text-brand-primary font-semibold hover:underline">
                    Criar conta
                  </button>
                </p>
              </div>
            </>
          )}

          {/* ── Registo ── */}
          {view === 'register' && (
            <>
              <h1 className="text-2xl font-bold text-brand-dark mb-6">Criar conta</h1>

              {error && <ErrorBox msg={error} />}

              <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Nome próprio">
                    <input
                      {...registerForm.register('firstName', { required: true })}
                      className={`input ${registerForm.formState.errors.firstName ? 'border-red-400' : ''}`}
                      placeholder="João"
                    />
                  </Field>
                  <Field label="Apelido">
                    <input
                      {...registerForm.register('lastName', { required: true })}
                      className={`input ${registerForm.formState.errors.lastName ? 'border-red-400' : ''}`}
                      placeholder="Silva"
                    />
                  </Field>
                </div>
                <Field label="Email">
                  <input
                    type="email"
                    {...registerForm.register('email', { required: true })}
                    className={`input ${registerForm.formState.errors.email ? 'border-red-400' : ''}`}
                    placeholder="email@exemplo.com"
                  />
                </Field>
                <Field label="Palavra-passe">
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      {...registerForm.register('password', { required: true, minLength: { value: 8, message: 'Mínimo 8 caracteres' } })}
                      className={`input pr-10 ${registerForm.formState.errors.password ? 'border-red-400' : ''}`}
                      placeholder="Mínimo 8 caracteres"
                    />
                    <TogglePass show={showPass} onToggle={() => setShowPass(!showPass)} />
                  </div>
                  {registerForm.formState.errors.password && (
                    <p className="text-red-500 text-xs mt-1">{registerForm.formState.errors.password.message}</p>
                  )}
                </Field>
                <Field label="Confirmar palavra-passe">
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      {...registerForm.register('confirmPassword', { required: true })}
                      className={`input pr-10 ${registerForm.formState.errors.confirmPassword ? 'border-red-400' : ''}`}
                      placeholder="Repete a palavra-passe"
                    />
                    <TogglePass show={showConfirm} onToggle={() => setShowConfirm(!showConfirm)} />
                  </div>
                </Field>
                <button type="submit" disabled={registerForm.formState.isSubmitting} className="btn-primary w-full flex items-center justify-center gap-2">
                  {registerForm.formState.isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Criar conta
                </button>
              </form>

              <div className="mt-5 pt-4 border-t border-gray-100 text-center text-sm">
                <p className="text-gray-500">
                  Já tens conta?{' '}
                  <button onClick={() => switchView('login')} className="text-brand-primary font-semibold hover:underline">
                    Entrar
                  </button>
                </p>
              </div>
            </>
          )}

          {/* ── Forgot password ── */}
          {view === 'forgot' && (
            <>
              <h1 className="text-2xl font-bold text-brand-dark mb-2">Recuperar palavra-passe</h1>
              <p className="text-sm text-gray-500 mb-6">
                Indica o teu email e enviamos um link para definires uma nova palavra-passe.
              </p>
              <div className="space-y-4">
                <Field label="Email">
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="input"
                    placeholder="o-teu-email@exemplo.com"
                  />
                </Field>
                <button
                  onClick={handleForgot}
                  disabled={forgotLoading || !forgotEmail}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {forgotLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Enviar link
                </button>
              </div>
              <button onClick={() => switchView('login')} className="mt-4 text-sm text-gray-500 hover:underline w-full text-center block">
                ← Voltar ao login
              </button>
            </>
          )}

          {/* ── Forgot sent ── */}
          {view === 'forgot-sent' && (
            <div className="text-center">
              <div className="w-14 h-14 bg-brand-green/20 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                ✉️
              </div>
              <h1 className="text-xl font-bold text-brand-dark mb-2">Verifica o teu email</h1>
              <p className="text-sm text-gray-500 mb-6">
                Se o endereço <strong>{forgotEmail}</strong> está registado,
                enviámos um link válido durante 15 minutos.
              </p>
              <button onClick={() => switchView('login')} className="btn-secondary w-full">
                Voltar ao login
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

/* ── Helpers ── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
      {msg}
    </div>
  );
}

function TogglePass({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      tabIndex={-1}
    >
      {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  );
}
