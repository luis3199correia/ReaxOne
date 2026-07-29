'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';
import WhatsAppBubble from './WhatsAppBubble';
import CartToast from '@/components/shop/CartToast';

export default function ConditionalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isComingSoon = pathname.includes('/coming-soon');
  // O backoffice tem o seu próprio layout (AdminSidebar) — não deve ter o Navbar/Footer do site,
  // que ficavam sobrepostos à barra móvel do backoffice e escondiam o menu em mobile.
  const isAdmin = pathname.split('/').includes('admin');

  if (isComingSoon || isAdmin) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsAppBubble />
      <CartToast />
    </div>
  );
}
