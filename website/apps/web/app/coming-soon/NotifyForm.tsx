'use client';

import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';

export default function NotifyForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    // Por agora guarda localmente — ligar à API quando disponível
    await new Promise((r) => setTimeout(r, 800));
    setStatus('done');
  }

  if (status === 'done') {
    return (
      <div className="flex items-center justify-center gap-2 text-brand-green font-semibold">
        <Check className="w-5 h-5" />
        Ótimo! Avisamos quando abrirmos.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-sm mx-auto">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="O teu email"
        className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="bg-brand-green text-brand-dark font-bold px-6 py-3 rounded-xl hover:brightness-110 transition-all text-sm whitespace-nowrap flex items-center gap-2 justify-center"
      >
        {status === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Avisa-me'}
      </button>
    </form>
  );
}
