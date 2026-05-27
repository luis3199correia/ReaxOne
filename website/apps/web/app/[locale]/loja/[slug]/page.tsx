import { useTranslations } from 'next-intl';

interface ProductPageProps {
  params: { locale: string; slug: string };
}

export default function ProductPage({ params }: ProductPageProps) {
  const t = useTranslations('shop');

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Product images */}
        <div className="aspect-square bg-gray-100 rounded-xl" />

        {/* Product info */}
        <div>
          <h1 className="text-3xl font-bold text-brand-dark mb-4">
            Nome do Produto
          </h1>
          <p className="text-2xl font-bold text-brand-primary mb-6">€0.00</p>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">{t('size')}</label>
            <div className="flex gap-2">
              {['XS', 'S', 'M', 'L', 'XL'].map((size) => (
                <button
                  key={size}
                  className="border-2 border-gray-300 rounded-lg px-4 py-2 hover:border-brand-primary transition-colors"
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-sm font-medium mb-2">
              {t('quantity')}
            </label>
            <div className="flex items-center gap-3">
              <button className="border rounded-lg w-10 h-10 flex items-center justify-center text-xl">
                -
              </button>
              <span className="text-xl font-medium">1</span>
              <button className="border rounded-lg w-10 h-10 flex items-center justify-center text-xl">
                +
              </button>
            </div>
          </div>

          <button className="btn-primary w-full text-lg">
            {t('add_to_cart')}
          </button>
        </div>
      </div>
    </div>
  );
}
