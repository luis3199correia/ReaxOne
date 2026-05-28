'use client';

import { useTranslations } from 'next-intl';

export default function AdminSettingsPage() {
  const t = useTranslations('admin');

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-dark mb-8">{t('settings')}</h1>

      <div className="space-y-6 max-w-2xl">

        {/* Payment config */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">{t('payment_config')}</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">MB Way — Número de telemóvel</label>
              <input className="input" placeholder="+351 9XX XXX XXX" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Transferência — IBAN</label>
              <input className="input" placeholder="PT50 0000 0000 0000 0000 0000 0" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Transferência — Titular</label>
              <input className="input" placeholder="Nome do titular da conta" />
            </div>
            <button className="btn-primary">Guardar configurações</button>
          </div>
        </div>

        {/* Store config */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Configurações da loja</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nome da loja</label>
              <input className="input" defaultValue="ReaxOne" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email de contacto</label>
              <input type="email" className="input" placeholder="geral@reaxone.com" />
            </div>
            <button className="btn-primary">Guardar</button>
          </div>
        </div>

        {/* Invoice config */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Faturação</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Fornecedor de faturação</label>
              <select className="input">
                <option value="">Selecionar...</option>
                <option value="invoicexpress">InvoiceXpress</option>
                <option value="moloni">Moloni</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">API Key</label>
              <input type="password" className="input" placeholder="••••••••••••" />
            </div>
            <button className="btn-primary">Guardar</button>
          </div>
        </div>

      </div>
    </div>
  );
}
