'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Package, ShoppingBag, Users, TrendingUp, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useLocale } from 'next-intl';

const STATUS_COLORS: Record<string, string> = {
  PENDING:   'bg-yellow-100 text-yellow-800',
  PAID:      'bg-blue-100 text-blue-800',
  SHIPPED:   'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING:   'Pendente',
  PAID:      'Pago',
  SHIPPED:   'Enviado',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado',
};

type Order = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  payment?: { method: string; status: string };
};

export default function AdminDashboard() {
  const locale = useLocale();
  const [orders, setOrders]   = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders')
      .then((r) => setOrders(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalSales   = orders.reduce((s, o) => s + o.totalAmount, 0);
  const totalOrders  = orders.length;
  const pendingOrders = orders.filter((o) => o.status === 'PENDING').length;
  const uniqueEmails  = new Set(orders.map((o) => o.email)).size;

  const stats = [
    { label: 'Vendas totais',       value: `€${totalSales.toFixed(2)}`, icon: TrendingUp,  color: 'text-brand-green' },
    { label: 'Encomendas',          value: String(totalOrders),          icon: ShoppingBag, color: 'text-brand-primary' },
    { label: 'Pendentes',           value: String(pendingOrders),         icon: Package,     color: 'text-yellow-500' },
    { label: 'Clientes únicos',     value: String(uniqueEmails),          icon: Users,       color: 'text-blue-500' },
  ];

  const recent = orders.slice(0, 8);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-dark mb-8">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((stat) => (
          <div key={stat.label} className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-500">{stat.label}</span>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="text-3xl font-bold text-brand-dark">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Encomendas recentes */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-base font-semibold text-brand-dark">Encomendas recentes</h2>
          <Link href={`/${locale}/admin/encomendas`} className="text-sm text-brand-primary hover:underline">
            Ver todas →
          </Link>
        </div>

        {recent.length === 0 ? (
          <p className="px-6 py-8 text-gray-500 text-sm text-center">Sem encomendas ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cliente</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Data</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recent.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-xs font-mono text-gray-400">
                      #{order.id.slice(-8).toUpperCase()}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-brand-dark">{order.firstName} {order.lastName}</p>
                      <p className="text-xs text-gray-400">{order.email}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 hidden sm:table-cell">
                      {new Date(order.createdAt).toLocaleDateString('pt-PT', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS[order.status] ?? order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-right text-brand-dark">
                      €{order.totalAmount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
