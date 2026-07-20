import type { Metadata } from 'next';
import ContaSidebar from './ContaSidebar';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function ContaLayout({ children }: { children: React.ReactNode }) {
  return <ContaSidebar>{children}</ContaSidebar>;
}
