import { useTranslations } from 'next-intl';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-blue-100 text-blue-800',
  SHIPPED: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export default function AdminOrdersPage() {
  const t = useTranslations('admin');

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-dark mb-8">{t('orders')}</h1>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium">#</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Cliente</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Data</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Pagamento</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Estado</th>
              <th className="text-right px-4 py-3 text-sm font-medium">Total</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-gray-500 text-sm">
                Sem encomendas ainda.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
