'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Loader2 } from 'lucide-react';

interface Order {
  id: string;
  createdAt: string;
  status: string;
  total: number;
}

export default function AccountPage() {
  const t = useTranslations('account');
  const locale = useLocale();
  const router = useRouter();

  const [orders, setOrders]     = useState<Order[]>([]);
  const [loading, setLoading]   = useState(true);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    // Check auth
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    fetch(`${apiUrl}/auth/me`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) { router.replace(`/${locale}/auth`); return; }
        setUserName(data.firstName ? `${data.firstName}` : data.email);
        // fetch orders for this user
        return api.get('/orders/mine');
      })
      .then((res) => { if (res) setOrders(res.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [locale, router]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {userName && (
        <p className="text-sm text-gray-500 mb-1">Bem-vindo, <strong>{userName}</strong></p>
      )}
      <h1 className="text-3xl font-bold text-brand-dark mb-8">{t('title')}</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar */}
        <aside className="space-y-1">
          <NavItem href={`/${locale}/conta`}        label={t('orders')}  active />
          <NavItem href={`/${locale}/conta/perfil`} label={t('profile')} />
        </aside>

        {/* Content */}
        <div className="md:col-span-3">
          <h2 className="text-xl font-semibold mb-4">{t('orders')}</h2>

          {orders.length === 0 ? (
            <div className="card p-12 text-center text-gray-500">
              {t('no_orders')}
            </div>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium">{t('order_number')}</th>
                    <th className="text-left px-4 py-3 text-sm font-medium">{t('order_date')}</th>
                    <th className="text-left px-4 py-3 text-sm font-medium">{t('order_status')}</th>
                    <th className="text-right px-4 py-3 text-sm font-medium">{t('order_total')}</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b last:border-0">
                      <td className="px-4 py-3 text-sm font-mono">#{order.id.slice(0, 8)}</td>
                      <td className="px-4 py-3 text-sm">
                        {new Date(order.createdAt).toLocaleDateString(locale === 'pt' ? 'pt-PT' : 'en-GB')}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium">€{Number(order.total).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NavItem({ href, label, active }: { href: string; label: string; active?: boolean }) {
  return (
    <a
      href={href}
      className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        active ? 'bg-brand-primary text-white' : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      {label}
    </a>
  );
}

const STATUS_LABELS: Record<string, string> = {
  PENDING:   'Pendente',
  PAID:      'Pago',
  SHIPPED:   'Enviado',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado',
};
const STATUS_COLORS: Record<string, string> = {
  PENDING:   'bg-yellow-100 text-yellow-800',
  PAID:      'bg-blue-100 text-blue-800',
  SHIPPED:   'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-700'}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
