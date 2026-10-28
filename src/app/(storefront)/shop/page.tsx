import { Suspense } from "react";
import type { Metadata } from "next";
import { ShopClient } from "@/components/shop/ShopClient";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Browse readymade women's dresses at Thanishka Boutique, Trivandrum — filter by size, occasion and collection.",
};

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="container-page py-20 font-serif text-muted">
          Loading the boutique…
        </div>
      }
    >
      <ShopClient />
    </Suspense>
  );
}
