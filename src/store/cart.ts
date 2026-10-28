"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product, Size } from "@/lib/products";

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  size: Size;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  coupon: string | null;
  addItem: (product: Product, size: Size, quantity?: number) => void;
  removeItem: (productId: string, size: Size) => void;
  updateQty: (productId: string, size: Size, quantity: number) => void;
  setCoupon: (code: string | null) => void;
  clear: () => void;
  count: () => number;
  subtotal: () => number;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      coupon: null,
      addItem: (product, size, quantity = 1) => {
        set((state) => {
          const existing = state.items.find(
            (i) => i.productId === product.id && i.size === size,
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === product.id && i.size === size
                  ? { ...i, quantity: i.quantity + quantity }
                  : i,
              ),
            };
          }
          return {
            items: [
              ...state.items,
              {
                productId: product.id,
                slug: product.slug,
                name: product.name,
                image: product.images[0],
                price: product.price,
                size,
                quantity,
              },
            ],
          };
        });
      },
      removeItem: (productId, size) =>
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.productId === productId && i.size === size),
          ),
        })),
      updateQty: (productId, size, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter(
                  (i) => !(i.productId === productId && i.size === size),
                )
              : state.items.map((i) =>
                  i.productId === productId && i.size === size
                    ? { ...i, quantity }
                    : i,
                ),
        })),
      setCoupon: (code) => set({ coupon: code }),
      clear: () => set({ items: [], coupon: null }),
      count: () => get().items.reduce((n, i) => n + i.quantity, 0),
      subtotal: () =>
        get().items.reduce((n, i) => n + i.price * i.quantity, 0),
    }),
    { name: "thanishka-cart" },
  ),
);
