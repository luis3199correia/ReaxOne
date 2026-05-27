'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { api } from '@/lib/api';

interface AuthForm {
  email: string;
  password: string;
  confirmPassword?: string;
}

export default function AuthPage() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');

  const { register, handleSubmit, watch } = useForm<AuthForm>();

  const onSubmit = async (data: AuthForm) => {
    setError('');
    try {
      if (isLogin) {
        const res = await api.post('/auth/login', {
          email: data.email,
          password: data.password,
        });
        // Cookie set by the server; redirect based on role
        if (res.data.role === 'ADMIN') {
          router.push(`/${locale}/admin`);
        } else {
          router.push(`/${locale}/conta`);
        }
      } else {
        await api.post('/auth/register', {
          email: data.email,
          password: data.password,
        });
        router.push(`/${locale}/conta`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || t('error'));
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <h1 className="text-2xl font-bold text-brand-dark mb-6">
            {isLogin ? t('login_title') : t('register_title')}
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

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('confirm_password')}
                </label>
                <input
                  type="password"
                  {...register('confirmPassword')}
                  className="input"
                />
              </div>
            )}

            <button type="submit" className="btn-primary w-full">
              {isLogin ? t('login_button') : t('register_button')}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            {isLogin ? t('no_account') : t('has_account')}{' '}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-brand-primary font-medium hover:underline"
            >
              {isLogin ? t('register_button') : t('login_button')}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
