'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Settings,
} from 'lucide-react';

export default function AdminSidebar() {
  const t = useTranslations('admin');
  const locale = useLocale();
  const pathname = usePathname();

  const links = [
    { href: `/${locale}/admin`, label: t('dashboard'), icon: LayoutDashboard },
    { href: `/${locale}/admin/produtos`, label: t('products'), icon: Package },
    { href: `/${locale}/admin/encomendas`, label: t('orders'), icon: ShoppingBag },
    { href: `/${locale}/admin/clientes`, label: t('customers'), icon: Users },
    { href: `/${locale}/admin/configuracoes`, label: t('settings'), icon: Settings },
  ];

  return (
    <aside className="w-56 bg-brand-dark text-white min-h-screen flex-shrink-0">
      <div className="p-6 border-b border-white/10">
        <p className="font-bold text-lg">
          REAX<span className="text-brand-primary">ONE</span>
        </p>
        <p className="text-xs text-gray-400 mt-1">{t('title')}</p>
      </div>
      <nav className="p-4 space-y-1">
        {links.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-brand-primary text-white'
                  : 'text-gray-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
