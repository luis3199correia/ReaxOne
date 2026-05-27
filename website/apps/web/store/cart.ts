import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  image?: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string, size?: string) => void;
  updateQuantity: (id: string, size: string | undefined, quantity: number) => void;
  clearCart: () => void;
  total: number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      total: 0,

      addItem: (item) => {
        set((state) => {
          const existing = state.items.find(
            (i) => i.id === item.id && i.size === item.size
          );
          let newItems: CartItem[];
          if (existing) {
            newItems = state.items.map((i) =>
              i.id === item.id && i.size === item.size
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            );
          } else {
            newItems = [...state.items, item];
          }
          return {
            items: newItems,
            total: newItems.reduce((acc, i) => acc + i.price * i.quantity, 0),
          };
        });
      },

      removeItem: (id, size) => {
        set((state) => {
          const newItems = state.items.filter(
            (i) => !(i.id === id && i.size === size)
          );
          return {
            items: newItems,
            total: newItems.reduce((acc, i) => acc + i.price * i.quantity, 0),
          };
        });
      },

      updateQuantity: (id, size, quantity) => {
        set((state) => {
          const newItems =
            quantity <= 0
              ? state.items.filter((i) => !(i.id === id && i.size === size))
              : state.items.map((i) =>
                  i.id === id && i.size === size ? { ...i, quantity } : i
                );
          return {
            items: newItems,
            total: newItems.reduce((acc, i) => acc + i.price * i.quantity, 0),
          };
        });
      },

      clearCart: () => set({ items: [], total: 0 }),
    }),
    {
      name: 'reaxone-cart',
    }
  )
);
