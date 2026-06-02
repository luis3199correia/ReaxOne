'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';
import WhatsAppBubble from './WhatsAppBubble';
import CartToast from '@/components/shop/CartToast';

export default function ConditionalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isComingSoon = pathname.includes('/coming-soon');

  if (isComingSoon) {
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
