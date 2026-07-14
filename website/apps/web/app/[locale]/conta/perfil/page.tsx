'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { api } from '@/lib/api';
import { Loader2, Check } from 'lucide-react';

interface ProfileForm {
  firstName: string;
  lastName: string;
  phone: string;
}

export default function PerfilPage() {
  const locale = useLocale();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saved, setSaved]     = useState(false);
  const [email, setEmail]     = useState('');
  const [apiError, setApiError] = useState('');

  const { register, handleSubmit, reset, formState: { isSubmitting, errors } } = useForm<ProfileForm>();

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    fetch(`${apiUrl}/auth/me`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) { router.replace(`/${locale}/auth`); return; }
        setEmail(data.email);
        reset({ firstName: data.firstName ?? '', lastName: data.lastName ?? '', phone: data.phone ?? '' });
      })
      .catch(() => router.replace(`/${locale}/auth`))
      .finally(() => setLoading(false));
  }, [locale, router, reset]);

  const onSubmit = async (data: ProfileForm) => {
    setApiError('');
    setSaved(false);
    try {
      await api.patch('/users/me', data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setApiError('Erro ao guardar. Tenta novamente.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-brand-dark mb-6">Perfil</h1>

      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">Dados pessoais</h2>

        {apiError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome próprio</label>
              <input
                {...register('firstName', { required: 'Obrigatório' })}
                className={`input ${errors.firstName ? 'border-red-400' : ''}`}
                placeholder="João"
              />
              {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Apelido</label>
              <input
                {...register('lastName', { required: 'Obrigatório' })}
                className={`input ${errors.lastName ? 'border-red-400' : ''}`}
                placeholder="Silva"
              />
              {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              disabled
              className="input bg-gray-50 text-gray-400 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">O email não pode ser alterado.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telemóvel</label>
            <input
              {...register('phone')}
              className="input"
              placeholder="+351 9XX XXX XXX"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Guardar alterações
            </button>
            {saved && (
              <span className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
                <Check className="w-4 h-4" /> Guardado!
              </span>
            )}
          </div>
        </form>
      </div>
    </>
  );
}
