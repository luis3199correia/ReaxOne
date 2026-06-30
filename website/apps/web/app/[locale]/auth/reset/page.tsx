'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { api } from '@/lib/api';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

function ResetForm() {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  if (!token) {
    return (
      <div className="text-center">
        <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <p className="text-gray-600">Link inválido ou expirado.</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setErrorMsg('A palavra-passe deve ter pelo menos 8 caracteres.'); return; }
    if (password !== confirm) { setErrorMsg('As palavras-passe não coincidem.'); return; }

    setLoading(true);
    setErrorMsg('');
    try {
      await api.post('/auth/reset-password', { token, password });
      setStatus('success');
      setTimeout(() => router.push(`/${locale}/auth`), 2500);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message ?? 'Link expirado ou inválido. Pede um novo link.');
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'success') {
    return (
      <div className="text-center">
        <CheckCircle className="w-12 h-12 text-brand-green mx-auto mb-3" />
        <h2 className="text-xl font-bold text-brand-dark mb-2">Palavra-passe atualizada!</h2>
        <p className="text-sm text-gray-500">A redirecionar para o login...</p>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-brand-dark mb-2">Nova palavra-passe</h1>
      <p className="text-sm text-gray-500 mb-6">Escolhe uma nova palavra-passe para a tua conta.</p>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nova palavra-passe</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            placeholder="Mínimo 8 caracteres"
            minLength={8}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Confirmar palavra-passe</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="input"
            placeholder="Repete a palavra-passe"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Guardar palavra-passe
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <Suspense fallback={<Loader2 className="w-6 h-6 animate-spin text-brand-primary mx-auto" />}>
            <ResetForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
