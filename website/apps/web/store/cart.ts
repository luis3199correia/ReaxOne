import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';
import {
  CartItem, CatalogProduct, cartTotal, linesFromStorage, pendingItem, refreshFromCatalog, toLine,
} from './cart.rules';

export type { CartItem } from './cart.rules';

const STORAGE_KEY = 'reaxone-cart';
// v1: só se guardam linhas (id, tamanho, quantidade); a v0 guardava preços e total
const STORAGE_VERSION = 1;

interface CartStore {
  items: CartItem[];
  total: number;
  /** false enquanto o carrinho guardado não tem preços do catálogo. */
  ready: boolean;
  lastAdded: CartItem | null;
  addItem: (item: CartItem) => void;
  removeItem: (id: string, size?: string) => void;
  updateQuantity: (id: string, size: string | undefined, quantity: number) => void;
  clearCart: () => void;
  clearLastAdded: () => void;
  syncWithCatalog: () => Promise<void>;
}

const sameLine = (a: { id: string; size?: string }, id: string, size?: string) => a.id === id && a.size === size;
const withTotal = (items: CartItem[]) => ({ items, total: cartTotal(items) });

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      total: 0,
      ready: false,
      lastAdded: null,

      addItem: (item) => set((state) => {
        const exists = state.items.some((i) => sameLine(i, item.id, item.size));
        const items = exists
          ? state.items.map((i) => (sameLine(i, item.id, item.size) ? { ...i, quantity: i.quantity + item.quantity } : i))
          : [...state.items, item];
        return { ...withTotal(items), lastAdded: item };
      }),

      removeItem: (id, size) => set((state) => withTotal(state.items.filter((i) => !sameLine(i, id, size)))),

      updateQuantity: (id, size, quantity) => set((state) => withTotal(
        quantity <= 0
          ? state.items.filter((i) => !sameLine(i, id, size))
          : state.items.map((i) => (sameLine(i, id, size) ? { ...i, quantity } : i)),
      )),

      clearCart: () => set({ items: [], total: 0, ready: true }),
      clearLastAdded: () => set({ lastAdded: null }),

      /** Preços, nomes e imagens sempre do catálogo; produtos que deixaram de estar à venda saem. */
      syncWithCatalog: async () => {
        if (get().items.length === 0) {
          set({ ready: true });
          return;
        }
        try {
          const { data } = await api.get<CatalogProduct[]>('/products');
          // Mantém o que o cliente mudou durante o pedido; só os dados do produto vêm do catálogo
          set((state) => ({ ...withTotal(refreshFromCatalog(state.items, data)), ready: true }));
        } catch {
          // Sem catálogo não há preços fiáveis: o carrinho fica "a carregar" e tenta de novo na próxima visita
        }
      },
    }),
    {
      name:    STORAGE_KEY,
      version: STORAGE_VERSION,
      partialize: (state) => ({ lines: state.items.map(toLine) }),
      migrate: (persisted) => ({ lines: linesFromStorage(persisted) }),
      merge: (persisted, current) => ({ ...current, items: linesFromStorage(persisted).map(pendingItem) }),
      onRehydrateStorage: () => (state) => {
        void state?.syncWithCatalog();
      },
    },
  ),
);
