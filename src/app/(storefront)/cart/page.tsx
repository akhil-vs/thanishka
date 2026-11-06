"use client";

import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { CheckoutForm } from "@/components/cart/CheckoutForm";
import { formatINR } from "@/lib/format";
import { useCart } from "@/store/cart";

export default function CartPage() {
  const { items, removeItem, updateQty } = useCart();

  return (
    <div className="container-page grid gap-12 py-12 lg:grid-cols-[1.2fr_0.8fr]">
      <div>
        <h1 className="font-display text-3xl tracking-[0.14em]">Bag</h1>
        {items.length === 0 ? (
          <div className="mt-10">
            <p className="font-serif text-xl text-muted">Your bag is empty.</p>
            <ButtonLink href="/shop" className="mt-6" variant="secondary">
              Shop New
            </ButtonLink>
          </div>
        ) : (
          <ul className="mt-8 divide-y divide-line border-y border-line">
            {items.map((item) => (
              <li
                key={`${item.productId}-${item.size}`}
                className="flex gap-4 py-6"
              >
                <Link
                  href={`/product/${item.slug}`}
                  className="relative h-32 w-24 shrink-0 bg-sand"
                >
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </Link>
                <div className="flex flex-1 flex-col">
                  <div className="flex justify-between gap-3">
                    <div>
                      <Link
                        href={`/product/${item.slug}`}
                        className="font-display text-[11px] tracking-[0.12em]"
                      >
                        {item.name}
                      </Link>
                      <p className="mt-1 text-sm text-muted">Size {item.size}</p>
                    </div>
                    <p>{formatINR(item.price * item.quantity)}</p>
                  </div>
                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex border border-line">
                      <button
                        type="button"
                        className="px-3 py-1"
                        onClick={() =>
                          updateQty(item.productId, item.size, item.quantity - 1)
                        }
                      >
                        −
                      </button>
                      <span className="px-2 py-1 text-sm">{item.quantity}</span>
                      <button
                        type="button"
                        className="px-3 py-1"
                        onClick={() =>
                          updateQty(item.productId, item.size, item.quantity + 1)
                        }
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      className="text-sm text-muted underline-offset-2 hover:underline"
                      onClick={() => removeItem(item.productId, item.size)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {items.length > 0 ? <CheckoutForm items={items} /> : (
        <aside className="h-fit border border-line bg-mist p-6">
          <h2 className="font-display text-sm tracking-[0.18em]">Checkout</h2>
          <p className="mt-4 font-serif text-muted">
            Add pieces to your bag to pay with Razorpay or cash on delivery.
          </p>
        </aside>
      )}
    </div>
  );
}
