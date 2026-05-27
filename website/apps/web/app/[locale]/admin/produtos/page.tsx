import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';

export default function AdminProductsPage() {
  const t = useTranslations('admin');

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-brand-dark">{t('products')}</h1>
        <button className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          {t('new_product')}
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium">Produto</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Categoria</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Preço</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Stock</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-gray-500 text-sm">
                Sem produtos. Cria o teu primeiro produto.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
