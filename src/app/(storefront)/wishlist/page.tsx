"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/lib/products";
import { ProductCard } from "@/components/product/ProductCard";
import { ButtonLink } from "@/components/ui/Button";
import { useWishlist } from "@/store/wishlist";

export default function WishlistPage() {
  const ids = useWishlist((s) => s.ids);
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/products")
      .then((res) => res.json())
      .then((data: { products?: Product[] }) => {
        if (!cancelled) setCatalog(data.products ?? []);
      })
      .catch(() => {
        if (!cancelled) setCatalog([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const items = catalog.filter((p) => ids.includes(p.id));

  return (
    <div className="container-page py-12 md:py-16">
      <h1 className="font-display text-3xl tracking-[0.14em]">Wishlist</h1>
      <p className="mt-2 font-serif text-muted">
        Saved looks — ready when you are.
      </p>
      {loading ? (
        <p className="mt-12 font-serif text-muted">Loading saved dresses…</p>
      ) : items.length === 0 ? (
        <div className="mt-12">
          <p className="font-serif text-xl text-muted">No saved dresses yet.</p>
          <ButtonLink href="/shop" className="mt-6" variant="secondary">
            Browse shop
          </ButtonLink>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
