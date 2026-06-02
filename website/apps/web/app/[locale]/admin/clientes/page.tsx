'use client';

import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, User } from 'lucide-react';
import { api } from '@/lib/api';

interface Customer {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  createdAt: string;
  _count?: { orders: number };
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/users')
      .then((res) => setCustomers(res.data))
      .catch(() => setError('Erro ao carregar clientes.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-brand-dark">Clientes</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {loading ? '...' : `${customers.length} cliente${customers.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-6 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-20 text-brand-muted">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          A carregar...
        </div>
      )}

      {!loading && (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cliente</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Telefone</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Encomendas</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Registo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-400 text-sm">
                    Nenhum cliente registado ainda.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-brand-muted" />
                        </div>
                        <p className="text-sm font-semibold text-brand-dark">
                          {c.firstName || c.lastName
                            ? `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim()
                            : '—'}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">{c.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">{c.phone ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{c._count?.orders ?? 0}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">
                      {new Date(c.createdAt).toLocaleDateString('pt-PT')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
