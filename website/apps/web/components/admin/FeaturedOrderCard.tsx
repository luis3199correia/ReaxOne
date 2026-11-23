'use client';

import Image from 'next/image';
import { ArrowUp, ArrowDown, Star, Loader2, AlertCircle } from 'lucide-react';

export interface FeaturedItem {
  id: string;
  name: string;
  images: string[];
  active: boolean;
  featuredOrder: number;
}

/** Devolve uma nova lista com o item `index` trocado com o vizinho (`delta` = -1 sobe, +1 desce). */
export function moveItem<T>(list: readonly T[], index: number, delta: number): T[] {
  const target = index + delta;
  if (target < 0 || target >= list.length) return [...list];
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

/**
 * Ordem dos produtos em destaque na página inicial.
 * Recebe a lista já ordenada; `onReorder` grava a nova ordem.
 */
export default function FeaturedOrderCard({
  items,
  saving,
  error,
  onReorder,
}: {
  items: FeaturedItem[];
  saving: boolean;
  error: string;
  onReorder: (next: FeaturedItem[]) => void;
}) {
  if (items.length === 0) return null;

  return (
    <div className="card p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-brand-dark flex items-center gap-2">
          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          Ordem dos destaques na página inicial
        </h2>
        {saving && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
      </div>

      {error && (
        <p className="text-red-500 text-xs flex items-center gap-1 mb-2">
          <AlertCircle className="w-3 h-3" /> {error}
        </p>
      )}

      <ol className="divide-y divide-gray-50">
        {items.map((p, i) => (
          <li key={p.id} className="flex items-center gap-3 py-2">
            <span className="w-6 text-xs font-semibold text-gray-400 text-right">{i + 1}.</span>
            <div className="relative w-8 h-8 rounded-md overflow-hidden bg-brand-light flex-shrink-0">
              {p.images[0] && (
                <Image src={p.images[0]} alt={p.name} fill className="object-cover" sizes="32px" />
              )}
            </div>
            <span className={`flex-1 text-sm ${p.active ? 'text-brand-dark' : 'text-gray-400'}`}>
              {p.name}
              {!p.active && <span className="ml-2 text-xs">(inativo — não aparece)</span>}
            </span>
            <button
              onClick={() => onReorder(moveItem(items, i, -1))}
              disabled={saving || i === 0}
              className="p-1.5 rounded-lg text-gray-400 hover:text-brand-primary hover:bg-brand-primary/10 disabled:opacity-30 disabled:hover:bg-transparent"
              title="Subir"
              aria-label={`Subir ${p.name}`}
            >
              <ArrowUp className="w-4 h-4" />
            </button>
            <button
              onClick={() => onReorder(moveItem(items, i, 1))}
              disabled={saving || i === items.length - 1}
              className="p-1.5 rounded-lg text-gray-400 hover:text-brand-primary hover:bg-brand-primary/10 disabled:opacity-30 disabled:hover:bg-transparent"
              title="Descer"
              aria-label={`Descer ${p.name}`}
            >
              <ArrowDown className="w-4 h-4" />
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
