"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import type { Product, Size } from "@/lib/products";
import { formatINR, cn } from "@/lib/format";
import { useCart } from "@/store/cart";
import { useWishlist } from "@/store/wishlist";
import { useUI } from "@/store/ui";

function firstInStock(product: Product): Size | null {
  const order: Size[] = ["XS", "S", "M", "L", "XL", "XXL"];
  return order.find((s) => product.sizes[s] > 0) ?? null;
}

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

  return (
    <article className="product-card group">
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
          className="absolute inset-x-3 bottom-3 translate-y-2 bg-ivory/95 py-2.5 font-display text-[10px] tracking-[0.18em] opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 max-md:translate-y-0 max-md:opacity-100"
          onClick={() => {
            const size = firstInStock(product);
            if (!size) return;
            addItem(product, size);
            openCart();
          }}
        >
          Quick Add
        </button>
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
