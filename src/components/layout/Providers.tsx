"use client";

import type { ReactNode } from "react";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { MobileBottomNav } from "@/components/layout/MobileNav";
import { SubscribePopup } from "@/components/home/SubscribePopup";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <CartDrawer />
      <WhatsAppButton />
      <MobileBottomNav />
      <SubscribePopup />
    </>
  );
}
