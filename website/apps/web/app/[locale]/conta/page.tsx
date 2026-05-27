import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useLocale } from 'next-intl';

export default function AccountPage() {
  const t = useTranslations('account');

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-brand-dark mb-8">{t('title')}</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar */}
        <aside className="space-y-1">
          <NavItem href="conta" label={t('orders')} active />
          <NavItem href="conta/perfil" label={t('profile')} />
        </aside>

        {/* Content */}
        <div className="md:col-span-3">
          <h2 className="text-xl font-semibold mb-4">{t('orders')}</h2>
          <OrdersTable />
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
        active
          ? 'bg-brand-primary text-white'
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      {label}
    </a>
  );
}

function OrdersTable() {
  const t = useTranslations('account');
  // Orders will be fetched from API
  const orders: any[] = [];

  if (orders.length === 0) {
    return (
      <div className="card p-12 text-center text-gray-500">
        {t('no_orders')}
      </div>
    );
  }

  return (
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
              <td className="px-4 py-3 text-sm">#{order.id}</td>
              <td className="px-4 py-3 text-sm">{order.date}</td>
              <td className="px-4 py-3 text-sm">{order.status}</td>
              <td className="px-4 py-3 text-sm text-right font-medium">€{order.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
