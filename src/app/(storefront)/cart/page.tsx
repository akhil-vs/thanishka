"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { formatINR } from "@/lib/format";
import { useCart } from "@/store/cart";

export default function CartPage() {
  const { items, removeItem, updateQty, subtotal, coupon, setCoupon, clear } =
    useCart();
  const [code, setCode] = useState(coupon ?? "");
  const [guest, setGuest] = useState(true);
  const [placed, setPlaced] = useState(false);
  const total = subtotal();
  const discount =
    coupon?.toUpperCase() === "THANISHKA10" ? Math.round(total * 0.1) : 0;
  const shipping = total - discount >= 1999 || total === 0 ? 0 : 99;

  if (placed) {
    return (
      <div className="container-page max-w-xl py-24 text-center">
        <p className="font-display text-[11px] tracking-[0.22em] text-kasavu-deep">
          Confirmed
        </p>
        <h1 className="mt-3 font-display text-3xl tracking-[0.14em]">
          Order placed
        </h1>
        <p className="mt-4 font-serif text-lg text-muted">
          A confirmation is on its way by email and WhatsApp. GST invoice will
          be attached when packed.
        </p>
        <ButtonLink href="/shop" className="mt-8">
          Continue shopping
        </ButtonLink>
      </div>
    );
  }

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
                        className="px-3 py-1"
                        onClick={() =>
                          updateQty(item.productId, item.size, item.quantity - 1)
                        }
                      >
                        −
                      </button>
                      <span className="px-2 py-1 text-sm">{item.quantity}</span>
                      <button
                        className="px-3 py-1"
                        onClick={() =>
                          updateQty(item.productId, item.size, item.quantity + 1)
                        }
                      >
                        +
                      </button>
                    </div>
                    <button
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

      <aside className="h-fit border border-line bg-mist p-6">
        <h2 className="font-display text-sm tracking-[0.18em]">Checkout</h2>
        <div className="mt-4 flex gap-2">
          <button
            className={`flex-1 border px-3 py-2 font-display text-[10px] tracking-[0.14em] ${
              guest ? "border-charcoal bg-charcoal text-ivory" : "border-line"
            }`}
            onClick={() => setGuest(true)}
          >
            Guest
          </button>
          <button
            className={`flex-1 border px-3 py-2 font-display text-[10px] tracking-[0.14em] ${
              !guest ? "border-charcoal bg-charcoal text-ivory" : "border-line"
            }`}
            onClick={() => setGuest(false)}
          >
            Account
          </button>
        </div>

        <form
          className="mt-5 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (items.length === 0) return;
            clear();
            setPlaced(true);
          }}
        >
          {!guest && (
            <input
              required
              type="email"
              placeholder="Account email"
              className="w-full border border-line bg-ivory px-3 py-2.5 text-sm outline-none focus:border-kasavu"
            />
          )}
          <input
            required
            placeholder="Full name"
            className="w-full border border-line bg-ivory px-3 py-2.5 text-sm outline-none focus:border-kasavu"
          />
          <input
            required
            placeholder="Phone / WhatsApp"
            className="w-full border border-line bg-ivory px-3 py-2.5 text-sm outline-none focus:border-kasavu"
          />
          <textarea
            required
            placeholder="Delivery address in Trivandrum or elsewhere"
            rows={3}
            className="w-full border border-line bg-ivory px-3 py-2.5 text-sm outline-none focus:border-kasavu"
          />

          <div className="flex gap-2 pt-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Coupon"
              className="flex-1 border border-line bg-ivory px-3 py-2.5 text-sm outline-none focus:border-kasavu"
            />
            <Button
              type="button"
              variant="secondary"
              className="px-4"
              onClick={() => setCoupon(code.trim() || null)}
            >
              Apply
            </Button>
          </div>

          <fieldset className="space-y-2 pt-2">
            <legend className="font-display text-[10px] tracking-[0.16em] text-muted">
              Payment
            </legend>
            {["UPI", "Cards", "Net banking", "Cash on delivery"].map((m) => (
              <label key={m} className="flex items-center gap-2 text-sm">
                <input type="radio" name="pay" defaultChecked={m === "UPI"} />
                {m}
              </label>
            ))}
          </fieldset>

          <div className="space-y-2 border-t border-line pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Subtotal</span>
              <span>{formatINR(total)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald">
                <span>Discount</span>
                <span>−{formatINR(discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted">Shipping</span>
              <span>{shipping === 0 ? "Free" : formatINR(shipping)}</span>
            </div>
            <div className="flex justify-between font-display text-[11px] tracking-[0.14em]">
              <span>Total</span>
              <span>{formatINR(total - discount + shipping)}</span>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={items.length === 0}
          >
            Place order
          </Button>
          <p className="text-center text-xs text-muted">
            Demo checkout — payments & GST wiring come in Phase 3.
          </p>
        </form>
      </aside>
    </div>
  );
}
