'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  LayoutDashboard,
  Package,
  Tag,
  ShoppingBag,
  Users,
  Settings,
  Menu,
  X,
  LogOut,
} from 'lucide-react';

export default function AdminSidebar() {
  const t = useTranslations('admin');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    try { await api.post('/auth/logout'); } catch {}
    router.push(`/${locale}/auth`);
  }

  const links = [
    { href: `/${locale}/admin`,               label: t('dashboard'), icon: LayoutDashboard },
    { href: `/${locale}/admin/produtos`,      label: t('products'),  icon: Package },
    { href: `/${locale}/admin/categorias`,    label: 'Categorias',   icon: Tag },
    { href: `/${locale}/admin/encomendas`,    label: t('orders'),    icon: ShoppingBag },
    { href: `/${locale}/admin/clientes`,      label: t('customers'), icon: Users },
    { href: `/${locale}/admin/configuracoes`, label: t('settings'),  icon: Settings },
  ];

  function NavLinks({ grow }: { grow?: boolean }) {
    return (
      <nav className={`p-4 space-y-1${grow ? ' flex-1 overflow-y-auto' : ''}`}>
        {links.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-brand-primary text-white'
                  : 'text-gray-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <>
      {/* ── Mobile top bar ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-brand-dark text-white flex items-center gap-3 px-4 h-14 shadow-lg">
        <button
          onClick={() => setOpen(true)}
          className="text-gray-300 hover:text-white p-1 -ml-1"
          aria-label="Abrir menu"
        >
          <Menu className="w-6 h-6" />
        </button>
        <p className="font-bold text-base flex-1">
          REAX<span className="text-brand-primary">ONE</span>
        </p>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-gray-300 hover:text-white text-sm font-medium px-2 py-1 rounded hover:bg-white/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </div>

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex w-56 bg-brand-dark text-white h-screen sticky top-0 flex-shrink-0 flex-col">
        <div className="flex-shrink-0 p-6 border-b border-white/10">
          <p className="font-bold text-lg">
            REAX<span className="text-brand-primary">ONE</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">{t('title')}</p>
        </div>
        <NavLinks grow />
        <div className="flex-shrink-0 p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-white/10 hover:text-white transition-colors w-full"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            Terminar sessão
          </button>
        </div>
      </aside>

      {/* ── Mobile drawer overlay ── */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          {/* Drawer */}
          <aside className="relative z-50 w-64 bg-brand-dark text-white flex flex-col h-full shadow-2xl">
            <div className="flex-shrink-0 px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <p className="font-bold text-lg">
                  REAX<span className="text-brand-primary">ONE</span>
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{t('title')}</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-white p-1"
                aria-label="Fechar menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <NavLinks grow />
            <div className="flex-shrink-0 p-4 border-t border-white/10">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-white/10 hover:text-white transition-colors w-full"
              >
                <LogOut className="w-4 h-4 flex-shrink-0" />
                Terminar sessão
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
