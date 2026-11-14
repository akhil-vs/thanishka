import { Suspense } from "react";
import type { Metadata } from "next";
import { ShopClient } from "@/components/shop/ShopClient";
import { listCatalogProducts } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Browse readymade women's dresses at Thanishka Boutique, Trivandrum — filter by size, occasion and collection.",
};

function ShopFallback() {
  return (
    <div className="container-page py-20 font-serif text-muted">
      Loading the boutique…
    </div>
  );
}

async function ShopPageInner() {
  const products = await listCatalogProducts();
  return <ShopClient products={products} />;
}

export default function ShopPage() {
  return (
    <Suspense fallback={<ShopFallback />}>
      <ShopPageInner />
    </Suspense>
  );
}
