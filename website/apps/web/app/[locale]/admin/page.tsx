import { useTranslations } from 'next-intl';
import { Package, ShoppingBag, Users, TrendingUp } from 'lucide-react';

export default function AdminDashboard() {
  const t = useTranslations('admin');

  const stats = [
    { label: t('total_sales'), value: '€0', icon: TrendingUp, color: 'text-brand-green' },
    { label: t('total_orders'), value: '0', icon: ShoppingBag, color: 'text-brand-primary' },
    { label: t('pending_orders'), value: '0', icon: Package, color: 'text-yellow-500' },
    { label: 'Clientes', value: '0', icon: Users, color: 'text-blue-500' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-dark mb-8">{t('dashboard')}</h1>

      {/* Stats grid */}
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

      {/* Recent orders */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">Encomendas recentes</h2>
        <p className="text-gray-500 text-sm">Sem encomendas ainda.</p>
      </div>
    </div>
  );
}
