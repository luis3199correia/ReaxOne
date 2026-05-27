import { useTranslations } from 'next-intl';

export default function ShopPage() {
  const t = useTranslations('shop');

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-brand-dark mb-8">{t('title')}</h1>

      <div className="flex gap-8">
        {/* Filters sidebar */}
        <aside className="w-64 hidden md:block">
          <h2 className="font-semibold text-lg mb-4">{t('filters')}</h2>
          {/* Filters will be implemented */}
        </aside>

        {/* Product grid */}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-6">
            <span className="text-gray-500">0 produtos</span>
            <select className="input w-auto">
              <option>{t('sort_newest')}</option>
              <option>{t('sort_price_asc')}</option>
              <option>{t('sort_price_desc')}</option>
            </select>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Product cards will be loaded from API */}
          </div>
        </div>
      </div>
    </div>
  );
}
