import { Metadata } from 'next';

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  try {
    const res = await fetch(`${apiUrl}/products/${slug}`, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error();
    const p: { name: string; description?: string; images: string[]; price: number } = await res.json();

    return {
      title: p.name,
      description: p.description ?? `${p.name} — €${p.price.toFixed(2)}. Encomenda agora na ReaxOne.`,
      openGraph: {
        title: `${p.name} | ReaxOne`,
        description: p.description ?? `${p.name} — €${p.price.toFixed(2)}`,
        images: p.images?.[0]
          ? [{ url: p.images[0], width: 800, height: 800, alt: p.name }]
          : [{ url: '/images/og/og-default.jpg', width: 1200, height: 630, alt: p.name }],
      },
    };
  } catch {
    return { title: 'Produto | ReaxOne' };
  }
}

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
