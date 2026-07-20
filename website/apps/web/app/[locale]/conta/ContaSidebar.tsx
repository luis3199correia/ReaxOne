'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { LogOut, ShoppingBag, User } from 'lucide-react';

export default function ContaLayout({ children }: { children: React.ReactNode }) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    try { await api.post('/auth/logout'); } catch {}
    router.push(`/${locale}/auth`);
  }

  const links = [
    { href: `/${locale}/conta`,        label: 'Encomendas', icon: ShoppingBag },
    { href: `/${locale}/conta/perfil`, label: 'Perfil',     icon: User },
  ];

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar */}
        <aside className="space-y-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <a
                key={href}
                href={href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active ? 'bg-brand-primary text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </a>
            );
          })}

          <div className="pt-2 border-t border-gray-200 mt-2">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-red-600 transition-colors w-full text-left"
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              Terminar sessão
            </button>
          </div>
        </aside>

        {/* Page content */}
        <div className="md:col-span-3">
          {children}
        </div>
      </div>
    </div>
  );
}
