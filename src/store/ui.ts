"use client";

import { create } from "zustand";

type UIState = {
  cartOpen: boolean;
  mobileNavOpen: boolean;
  locale: "en" | "ml";
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  openMobileNav: () => void;
  closeMobileNav: () => void;
  toggleLocale: () => void;
};

export const useUI = create<UIState>((set) => ({
  cartOpen: false,
  mobileNavOpen: false,
  locale: "en",
  openCart: () => set({ cartOpen: true }),
  closeCart: () => set({ cartOpen: false }),
  toggleCart: () => set((s) => ({ cartOpen: !s.cartOpen })),
  openMobileNav: () => set({ mobileNavOpen: true }),
  closeMobileNav: () => set({ mobileNavOpen: false }),
  toggleLocale: () =>
    set((s) => ({ locale: s.locale === "en" ? "ml" : "en" })),
}));
