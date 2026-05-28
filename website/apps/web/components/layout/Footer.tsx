import { useLocale } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';


export default function Footer() {
  const locale = useLocale();
  const prefix = `/${locale}`;

  return (
    <footer className="bg-brand-dark text-gray-400">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          <div className="col-span-2 md:col-span-1">
            <Image
              src="/images/marca/logo.png"
              alt="ReaxOne"
              width={120}
              height={34}
              className="object-contain mb-3"
            />
            <p className="text-sm leading-relaxed mb-4">
              Equipamento desportivo para quem leva o treino a sério.
            </p>
            <p className="text-xs text-gray-600 italic">React First. Never Performed.</p>
          </div>

          <div>
            <h3 className="text-white text-sm font-semibold mb-4 uppercase tracking-wider">Loja</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href={`${prefix}/loja`} className="hover:text-brand-green transition-colors">Todos os produtos</Link></li>
              <li><Link href={`${prefix}/loja?categoria=equipamento`} className="hover:text-brand-green transition-colors">Equipamento</Link></li>
              <li><Link href={`${prefix}/loja?categoria=roupa`} className="hover:text-brand-green transition-colors">Roupa</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white text-sm font-semibold mb-4 uppercase tracking-wider">Empresa</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href={`${prefix}/sobre`} className="hover:text-brand-green transition-colors">Sobre nós</Link></li>
              <li><Link href={`${prefix}/contacto`} className="hover:text-brand-green transition-colors">Contacto</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white text-sm font-semibold mb-4 uppercase tracking-wider">Apoio</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href={`${prefix}/envios`} className="hover:text-brand-green transition-colors">Envios e devoluções</Link></li>
              <li><Link href={`${prefix}/privacidade`} className="hover:text-brand-green transition-colors">Privacidade</Link></li>
              <li><Link href={`${prefix}/termos`} className="hover:text-brand-green transition-colors">Termos</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-600">
          <p>© {new Date().getFullYear()} ReaxOne®. Todos os direitos reservados.</p>
          <p>🇵🇹 Feito em Portugal</p>
        </div>
      </div>
    </footer>
  );
}
