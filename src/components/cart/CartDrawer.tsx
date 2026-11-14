"use client";

import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { formatINR } from "@/lib/format";
import { authFetch } from "@/lib/auth/client";
import { useCart } from "@/store/cart";
import { useUI } from "@/store/ui";

type Quote = {
  subtotal: number;
  discountAmount: number;
  shippingAmount: number;
  total: number;
  couponCode: string | null;
  couponLabel: string | null;
  couponError: string | null;
};

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function CartDrawer() {
  const { cartOpen, closeCart } = useUI();
  const { items, removeItem, updateQty, subtotal, coupon, setCoupon } =
    useCart();
  const [code, setCode] = useState("");
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponMsg, setCouponMsg] = useState("");
  const [couponOk, setCouponOk] = useState(false);
  const mounted = useIsClient();
  const total = subtotal();

  useEffect(() => {
    document.body.style.overflow = cartOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [cartOpen]);

  async function applyCoupon() {
    const next = code.trim() || null;
    setCouponMsg("");
    setCouponOk(false);
    if (!next) {
      setCoupon(null);
      setCouponMsg("Coupon cleared");
      return;
    }
    if (items.length === 0) {
      setCouponMsg("Add items before applying a coupon");
      return;
    }
    setCouponBusy(true);
    try {
      const data = await authFetch<Quote>("/api/checkout/quote", {
        method: "POST",
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            size: i.size,
            quantity: i.quantity,
          })),
          couponCode: next,
        }),
      });
      if (data.couponError) {
        setCoupon(null);
        setCouponMsg(data.couponError);
        setCouponOk(false);
        return;
      }
      setCoupon(data.couponCode);
      setCouponOk(true);
      setCouponMsg(
        `${data.couponLabel || data.couponCode} applied — −${formatINR(data.discountAmount)}`,
      );
    } catch (err) {
      setCoupon(null);
      setCouponOk(false);
      setCouponMsg(err instanceof Error ? err.message : "Invalid coupon");
    } finally {
      setCouponBusy(false);
    }
  }

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {cartOpen && (
        <>
          <motion.button
            aria-label="Close cart backdrop"
            className="fixed inset-0 z-50 bg-ink/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
          />
          <motion.aside
            className="fixed top-0 right-0 z-50 flex h-full w-full max-w-md flex-col bg-ivory shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="font-display text-sm tracking-[0.22em]">
                Your Bag ({items.reduce((n, i) => n + i.quantity, 0)})
              </h2>
              <button aria-label="Close cart" onClick={closeCart} className="p-1">
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                  <p className="font-serif text-xl text-muted">Your bag is empty</p>
                  <ButtonLink href="/shop" onClick={closeCart} variant="secondary">
                    Shop New
                  </ButtonLink>
                </div>
              ) : (
                <ul className="space-y-5">
                  {items.map((item) => (
                    <li key={`${item.productId}-${item.size}`} className="flex gap-4">
                      <Link
                        href={`/product/${item.slug}`}
                        onClick={closeCart}
                        className="relative h-28 w-20 shrink-0 overflow-hidden bg-sand"
                      >
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </Link>
                      <div className="flex flex-1 flex-col">
                        <div className="flex justify-between gap-2">
                          <Link
                            href={`/product/${item.slug}`}
                            onClick={closeCart}
                            className="font-display text-[11px] tracking-[0.12em] leading-relaxed"
                          >
                            {item.name}
                          </Link>
                          <button
                            onClick={() => removeItem(item.productId, item.size)}
                            className="text-muted hover:text-charcoal"
                            aria-label="Remove"
                          >
                            <X size={14} />
                          </button>
                        </div>
                        <p className="mt-1 text-sm text-muted">Size {item.size}</p>
                        <div className="mt-auto flex items-center justify-between">
                          <div className="flex items-center border border-line">
                            <button
                              className="px-2.5 py-1 text-sm"
                              onClick={() =>
                                updateQty(
                                  item.productId,
                                  item.size,
                                  item.quantity - 1,
                                )
                              }
                            >
                              −
                            </button>
                            <span className="px-2 text-sm">{item.quantity}</span>
                            <button
                              className="px-2.5 py-1 text-sm"
                              onClick={() =>
                                updateQty(
                                  item.productId,
                                  item.size,
                                  item.quantity + 1,
                                )
                              }
                            >
                              +
                            </button>
                          </div>
                          <p className="text-sm">{formatINR(item.price)}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-line px-5 py-5">
                <form
                  className="mb-3 flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void applyCoupon();
                  }}
                >
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Coupon code"
                    className="flex-1 border border-line bg-transparent px-3 py-2 text-sm outline-none focus:border-kasavu"
                  />
                  <Button
                    type="submit"
                    variant="secondary"
                    className="px-4"
                    disabled={couponBusy}
                  >
                    {couponBusy ? "…" : "Apply"}
                  </Button>
                </form>
                {couponMsg ? (
                  <p
                    className={`mb-3 text-sm ${couponOk ? "text-emerald" : "text-sale"}`}
                  >
                    {couponMsg}
                  </p>
                ) : coupon ? (
                  <p className="mb-3 text-sm text-emerald">
                    Coupon {coupon} ready for checkout
                  </p>
                ) : null}
                <div className="mb-4 flex justify-between font-display text-[11px] tracking-[0.16em]">
                  <span>Subtotal</span>
                  <span>{formatINR(total)}</span>
                </div>
                <ButtonLink
                  href="/cart"
                  variant="primary"
                  className="w-full"
                  onClick={closeCart}
                >
                  Checkout
                </ButtonLink>
                <p className="mt-3 text-center text-xs text-muted">
                  Razorpay · UPI · Cards · Net banking · COD
                </p>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
