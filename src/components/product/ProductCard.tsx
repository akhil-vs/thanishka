"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { Heart, X } from "lucide-react";
import type { Product, Size } from "@/lib/products";
import { formatINR, cn } from "@/lib/format";
import { useCart } from "@/store/cart";
import { useWishlist } from "@/store/wishlist";
import { useUI } from "@/store/ui";

const sizeOrder: Size[] = ["XS", "S", "M", "L", "XL", "XXL"];

export function ProductCard({
  product,
  priority = false,
}: {
  product: Product;
  priority?: boolean;
}) {
  const toggle = useWishlist((s) => s.toggle);
  const wished = useWishlist((s) => s.ids.includes(product.id));
  const addItem = useCart((s) => s.addItem);
  const openCart = useUI((s) => s.openCart);
  const [pickingSize, setPickingSize] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!pickingSize) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPickingSize(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pickingSize]);

  const inStockSizes = sizeOrder.filter((s) => (product.sizes[s] ?? 0) > 0);

  return (
    <article className="product-card group relative">
      <div className="relative aspect-[3/4] overflow-hidden bg-sand">
        <Link href={`/product/${product.slug}`} className="absolute inset-0">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            priority={priority}
            sizes="(max-width: 768px) 50vw, 25vw"
            className="product-card-primary object-cover"
          />
          <Image
            src={product.images[1]}
            alt=""
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="product-card-secondary object-cover"
          />
        </Link>

        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {product.isNew && (
            <span className="bg-ivory/90 px-2 py-1 font-display text-[9px] tracking-[0.16em]">
              New
            </span>
          )}
          {product.onSale && (
            <span className="bg-sale px-2 py-1 font-display text-[9px] tracking-[0.16em] text-ivory">
              Sale
            </span>
          )}
        </div>

        <button
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          onClick={() => toggle(product.id)}
          className={cn(
            "absolute top-3 right-3 flex h-9 w-9 items-center justify-center bg-ivory/90 transition hover:scale-105",
            wished && "text-sale",
          )}
        >
          <Heart
            size={16}
            strokeWidth={1.5}
            fill={wished ? "currentColor" : "none"}
          />
        </button>

        <button
          type="button"
          className="absolute inset-x-3 bottom-3 translate-y-2 bg-ivory/95 py-2.5 font-display text-[10px] tracking-[0.18em] opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 max-md:translate-y-0 max-md:opacity-100"
          onClick={() => {
            if (inStockSizes.length === 0) return;
            setPickingSize(true);
          }}
        >
          {inStockSizes.length === 0 ? "Sold out" : "Quick Add"}
        </button>

        {pickingSize ? (
          <div
            className="absolute inset-0 z-10 flex flex-col justify-end bg-ink/45 p-3"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
          >
            <div className="border border-line bg-ivory p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p
                  id={titleId}
                  className="font-display text-[10px] tracking-[0.16em]"
                >
                  Select size
                </p>
                <button
                  type="button"
                  aria-label="Close size picker"
                  className="p-1 text-muted"
                  onClick={() => setPickingSize(false)}
                >
                  <X size={14} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {sizeOrder.map((s) => {
                  const qty = product.sizes[s] ?? 0;
                  const disabled = qty <= 0;
                  return (
                    <button
                      key={s}
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        addItem(product, s);
                        setPickingSize(false);
                        openCart();
                      }}
                      className={cn(
                        "min-w-10 border px-2.5 py-1.5 font-display text-[10px] tracking-[0.12em]",
                        disabled
                          ? "cursor-not-allowed opacity-30 line-through"
                          : "border-line hover:border-charcoal hover:bg-charcoal hover:text-ivory",
                      )}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-3 space-y-1">
        <p className="font-display text-[10px] tracking-[0.16em] text-muted">
          {product.category}
        </p>
        <Link
          href={`/product/${product.slug}`}
          className="block font-serif text-base leading-snug transition hover:text-kasavu-deep md:text-lg"
        >
          {product.name}
        </Link>
        <div className="flex items-baseline gap-2">
          <span className="text-sm">{formatINR(product.price)}</span>
          {product.compareAt && (
            <span className="text-sm text-muted line-through">
              {formatINR(product.compareAt)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
