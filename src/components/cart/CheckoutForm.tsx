"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { formatINR } from "@/lib/format";
import { authFetch } from "@/lib/auth/client";
import { openRazorpayCheckout } from "@/lib/checkout/razorpay-browser";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/checkout/constants";
import { useCart, type CartItem } from "@/store/cart";
import type { SerializedOrder } from "@/lib/checkout/types";

type Quote = {
  subtotal: number;
  discountAmount: number;
  shippingAmount: number;
  total: number;
  couponCode: string | null;
  couponLabel: string | null;
  couponError: string | null;
};

type CreateResult =
  | {
      mode: "razorpay";
      order: SerializedOrder;
      amountPaise: number;
      currency: string;
      keyId: string;
      razorpayOrderId: string;
    }
  | {
      mode: "dev";
      order: SerializedOrder;
      amountPaise: number;
      currency: string;
      keyId: string | null;
      razorpayOrderId: string | null;
    }
  | {
      mode: "cod";
      order: SerializedOrder;
    };

type Address = {
  id: string;
  label: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  phone: string | null;
  isDefault: boolean;
};

type MeResponse = {
  user: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  };
  addresses: Address[];
};

function cartPayload(items: CartItem[]) {
  return items.map((i) => ({
    productId: i.productId,
    size: i.size,
    quantity: i.quantity,
  }));
}

export function CheckoutForm({ items }: { items: CartItem[] }) {
  const router = useRouter();
  const { coupon, setCoupon, clear } = useCart();
  const [code, setCode] = useState(coupon ?? "");
  const [guest, setGuest] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "cod">(
    "razorpay",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [me, setMe] = useState<MeResponse | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("Thiruvananthapuram");
  const [state, setState] = useState("Kerala");
  const [postalCode, setPostalCode] = useState("");

  const itemKey = useMemo(
    () => items.map((i) => `${i.productId}:${i.size}:${i.quantity}`).join("|"),
    [items],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await authFetch<MeResponse>("/api/auth/customer/me");
        if (cancelled) return;
        setMe(data);
        setGuest(false);
        setName(data.user.name || "");
        setEmail(data.user.email || "");
        setPhone(data.user.phone || "");
        const addr =
          data.addresses.find((a) => a.isDefault) ?? data.addresses[0];
        if (addr) {
          setLine1(addr.line1);
          setLine2(addr.line2 || "");
          setCity(addr.city);
          setState(addr.state);
          setPostalCode(addr.postalCode);
          if (addr.phone) setPhone(addr.phone);
        }
      } catch {
        if (!cancelled) setMe(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (items.length === 0) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const data = await authFetch<Quote>("/api/checkout/quote", {
          method: "POST",
          body: JSON.stringify({
            items: cartPayload(items),
            couponCode: coupon,
          }),
        });
        if (!cancelled) setQuote(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Unable to price bag",
          );
        }
      }
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [itemKey, coupon, items]);

  const activeQuote = items.length === 0 ? null : quote;

  async function applyCoupon() {
    setError("");
    const next = code.trim() || null;
    setCoupon(next);
    if (!next) return;
    try {
      const data = await authFetch<Quote>("/api/checkout/quote", {
        method: "POST",
        body: JSON.stringify({
          items: cartPayload(items),
          couponCode: next,
        }),
      });
      setQuote(data);
      if (data.couponError) setError(data.couponError);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid coupon");
    }
  }

  async function finishSuccess(order: SerializedOrder) {
    clear();
    router.push(`/order/${order.id}`);
  }

  async function verifyRazorpay(opts: {
    orderId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) {
    const data = await authFetch<{ order: SerializedOrder }>(
      "/api/checkout/verify",
      {
        method: "POST",
        body: JSON.stringify(opts),
      },
    );
    await finishSuccess(data.order);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (items.length === 0 || busy) return;
    setBusy(true);
    setError("");

    try {
      if (!guest && !me) {
        throw new Error("Sign in at Account, or continue as guest");
      }

      const created = await authFetch<CreateResult>("/api/checkout/create", {
        method: "POST",
        body: JSON.stringify({
          items: cartPayload(items),
          customerName: name,
          customerEmail: email || undefined,
          customerPhone: phone,
          shippingLine1: line1,
          shippingLine2: line2 || null,
          shippingCity: city,
          shippingState: state,
          shippingPostalCode: postalCode,
          couponCode: coupon,
          paymentMethod,
        }),
      });

      if (created.mode === "cod") {
        await finishSuccess(created.order);
        return;
      }

      if (created.mode === "dev") {
        const data = await authFetch<{ order: SerializedOrder }>(
          "/api/checkout/verify",
          {
            method: "POST",
            body: JSON.stringify({
              orderId: created.order.id,
              devComplete: true,
            }),
          },
        );
        await finishSuccess(data.order);
        return;
      }

      await openRazorpayCheckout({
        keyId: created.keyId,
        amountPaise: created.amountPaise,
        currency: created.currency,
        razorpayOrderId: created.razorpayOrderId,
        orderNumber: created.order.orderNumber,
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        onSuccess: async (res) => {
          try {
            await verifyRazorpay({
              orderId: created.order.id,
              razorpayOrderId: res.razorpay_order_id,
              razorpayPaymentId: res.razorpay_payment_id,
              razorpaySignature: res.razorpay_signature,
            });
          } catch (err) {
            setError(
              err instanceof Error
                ? err.message
                : "Payment captured but verification failed — contact support with your order number",
            );
            setBusy(false);
          }
        },
        onDismiss: () => setBusy(false),
      });
      // Keep busy until handler/dismiss; Razorpay modal is open
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
      setBusy(false);
    }
  }

  const subtotal =
    activeQuote?.subtotal ??
    items.reduce((n, i) => n + i.price * i.quantity, 0);
  const discount = activeQuote?.discountAmount ?? 0;
  const shipping =
    activeQuote?.shippingAmount ??
    (subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 99);
  const total = activeQuote?.total ?? subtotal - discount + shipping;

  return (
    <aside className="h-fit border border-line bg-mist p-6">
      <h2 className="font-display text-sm tracking-[0.18em]">Checkout</h2>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          className={`flex-1 border px-3 py-2 font-display text-[10px] tracking-[0.14em] ${
            guest ? "border-charcoal bg-charcoal text-ivory" : "border-line"
          }`}
          onClick={() => setGuest(true)}
        >
          Guest
        </button>
        <button
          type="button"
          className={`flex-1 border px-3 py-2 font-display text-[10px] tracking-[0.14em] ${
            !guest ? "border-charcoal bg-charcoal text-ivory" : "border-line"
          }`}
          onClick={() => setGuest(false)}
        >
          Account
        </button>
      </div>

      {!guest && !me ? (
        <p className="mt-3 text-sm text-muted">
          <a href="/account" className="underline underline-offset-2">
            Sign in
          </a>{" "}
          to use saved addresses, or continue as guest.
        </p>
      ) : null}

      <form className="mt-5 space-y-3" onSubmit={onSubmit}>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name"
          className="w-full border border-line bg-ivory px-3 py-2.5 text-sm outline-none focus:border-kasavu"
        />
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email (required for receipt)"
          className="w-full border border-line bg-ivory px-3 py-2.5 text-sm outline-none focus:border-kasavu"
        />
        <input
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone / WhatsApp"
          className="w-full border border-line bg-ivory px-3 py-2.5 text-sm outline-none focus:border-kasavu"
        />
        <textarea
          required
          value={line1}
          onChange={(e) => setLine1(e.target.value)}
          placeholder="Address line 1"
          rows={2}
          className="w-full border border-line bg-ivory px-3 py-2.5 text-sm outline-none focus:border-kasavu"
        />
        <input
          value={line2}
          onChange={(e) => setLine2(e.target.value)}
          placeholder="Address line 2 (optional)"
          className="w-full border border-line bg-ivory px-3 py-2.5 text-sm outline-none focus:border-kasavu"
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            required
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City"
            className="w-full border border-line bg-ivory px-3 py-2.5 text-sm outline-none focus:border-kasavu"
          />
          <input
            required
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            placeholder="PIN code"
            className="w-full border border-line bg-ivory px-3 py-2.5 text-sm outline-none focus:border-kasavu"
          />
        </div>
        <input
          required
          value={state}
          onChange={(e) => setState(e.target.value)}
          placeholder="State"
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
            onClick={applyCoupon}
          >
            Apply
          </Button>
        </div>
        {activeQuote?.couponCode && !activeQuote.couponError ? (
          <p className="text-sm text-emerald">
            {activeQuote.couponLabel || activeQuote.couponCode} applied
          </p>
        ) : null}

        <fieldset className="space-y-2 pt-2">
          <legend className="font-display text-[10px] tracking-[0.16em] text-muted">
            Payment
          </legend>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="pay"
              checked={paymentMethod === "razorpay"}
              onChange={() => setPaymentMethod("razorpay")}
            />
            Pay online — UPI, cards, net banking (Razorpay)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="pay"
              checked={paymentMethod === "cod"}
              onChange={() => setPaymentMethod("cod")}
            />
            Cash on delivery
          </label>
        </fieldset>

        <div className="space-y-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Subtotal</span>
            <span>{formatINR(subtotal)}</span>
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
            <span>{formatINR(total)}</span>
          </div>
        </div>

        {error ? <p className="text-sm text-sale">{error}</p> : null}

        <Button
          type="submit"
          className="w-full"
          disabled={items.length === 0 || busy}
        >
          {busy
            ? "Processing…"
            : paymentMethod === "cod"
              ? "Place COD order"
              : "Pay securely"}
        </Button>
        <p className="text-center text-xs text-muted">
          Prices and stock are confirmed on the server. Free shipping above{" "}
          {formatINR(FREE_SHIPPING_THRESHOLD)}.
        </p>
      </form>
    </aside>
  );
}
