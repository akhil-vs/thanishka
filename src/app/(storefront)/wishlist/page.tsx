"use client";

import { products } from "@/lib/products";
import { ProductCard } from "@/components/product/ProductCard";
import { ButtonLink } from "@/components/ui/Button";
import { useWishlist } from "@/store/wishlist";

export default function WishlistPage() {
  const ids = useWishlist((s) => s.ids);
  const items = products.filter((p) => ids.includes(p.id));

  return (
    <div className="container-page py-12 md:py-16">
      <h1 className="font-display text-3xl tracking-[0.14em]">Wishlist</h1>
      <p className="mt-2 font-serif text-muted">
        Saved looks — ready when you are.
      </p>
      {items.length === 0 ? (
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
