"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { formatINR } from "@/lib/format";
import { authFetch } from "@/lib/auth/client";
import type { SerializedOrder } from "@/lib/checkout/types";

function statusLabel(status: string) {
  switch (status) {
    case "PAID":
      return "Paid";
    case "COD_CONFIRMED":
      return "COD confirmed";
    case "PENDING_PAYMENT":
      return "Awaiting payment";
    case "PACKED":
      return "Packed";
    case "SHIPPED":
      return "Shipped";
    case "DELIVERED":
      return "Delivered";
    case "PAYMENT_FAILED":
      return "Payment failed";
    case "CANCELLED":
      return "Cancelled";
    default:
      return status;
  }
}

export function OrderConfirmation({
  orderId,
  accessToken,
}: {
  orderId: string;
  accessToken?: string | null;
}) {
  const [order, setOrder] = useState<SerializedOrder | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let token = accessToken ?? null;
        if (!token) {
          try {
            token = sessionStorage.getItem(`thanishka_order_t_${orderId}`);
          } catch {
            token = null;
          }
        }
        const qs = token ? `?t=${encodeURIComponent(token)}` : "";
        const data = await authFetch<{ order: SerializedOrder }>(
          `/api/checkout/orders/${orderId}${qs}`,
        );
        if (!cancelled) setOrder(data.order);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Order not found");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId, accessToken]);

  if (error) {
    return (
      <div className="container-page max-w-xl py-24 text-center">
        <h1 className="font-display text-3xl tracking-[0.14em]">Order</h1>
        <p className="mt-4 font-serif text-muted">{error}</p>
        <ButtonLink href="/shop" className="mt-8" variant="secondary">
          Back to shop
        </ButtonLink>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container-page max-w-xl py-24 text-center">
        <p className="font-serif text-muted">Loading order…</p>
      </div>
    );
  }

  const confirmed =
    order.status === "PAID" || order.status === "COD_CONFIRMED";

  return (
    <div className="container-page max-w-2xl py-16 md:py-24">
      <p className="font-display text-[11px] tracking-[0.22em] text-kasavu-deep">
        {confirmed ? "Confirmed" : statusLabel(order.status)}
      </p>
      <h1 className="mt-3 font-display text-3xl tracking-[0.14em]">
        {confirmed ? "Order placed" : "Order details"}
      </h1>
      <p className="mt-3 font-serif text-lg text-muted">
        {order.orderNumber}
        {order.paymentMethod === "RAZORPAY" && order.razorpayPaymentId
          ? ` · Payment ${order.razorpayPaymentId}`
          : order.paymentMethod === "COD"
            ? " · Cash on delivery"
            : ""}
      </p>
      {confirmed ? (
        <p className="mt-2 text-sm text-muted">
          We will follow up on your email and phone when packing starts. Need a
          GST tax invoice? Message us with your order number.
        </p>
      ) : null}

      <ul className="mt-10 divide-y divide-line border-y border-line">
        {order.items.map((item) => (
          <li key={item.id} className="flex gap-4 py-5">
            <Link
              href={`/product/${item.slug}`}
              className="relative h-24 w-20 shrink-0 bg-sand"
            >
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="72px"
                />
              ) : null}
            </Link>
            <div className="flex flex-1 justify-between gap-3">
              <div>
                <Link
                  href={`/product/${item.slug}`}
                  className="font-display text-[11px] tracking-[0.12em]"
                >
                  {item.name}
                </Link>
                <p className="mt-1 text-sm text-muted">
                  Size {item.size} · Qty {item.quantity}
                </p>
              </div>
              <p className="text-sm">{formatINR(item.lineTotal)}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-6 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted">Subtotal</span>
          <span>{formatINR(order.subtotal)}</span>
        </div>
        {order.discountAmount > 0 ? (
          <div className="flex justify-between text-emerald">
            <span>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</span>
            <span>−{formatINR(order.discountAmount)}</span>
          </div>
        ) : null}
        <div className="flex justify-between">
          <span className="text-muted">Shipping</span>
          <span>
            {order.shippingAmount === 0
              ? "Free"
              : formatINR(order.shippingAmount)}
          </span>
        </div>
        <div className="flex justify-between font-display text-[11px] tracking-[0.14em]">
          <span>Total</span>
          <span>{formatINR(order.total)}</span>
        </div>
      </div>

      <div className="mt-8 border border-line bg-mist p-5 text-sm">
        <p className="font-display text-[10px] tracking-[0.16em]">Ship to</p>
        <p className="mt-2 font-serif">
          {order.customerName}
          <br />
          {order.shipping.line1}
          {order.shipping.line2 ? (
            <>
              <br />
              {order.shipping.line2}
            </>
          ) : null}
          <br />
          {order.shipping.city}, {order.shipping.state}{" "}
          {order.shipping.postalCode}
          <br />
          {order.customerPhone}
        </p>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <ButtonLink href="/shop">Continue shopping</ButtonLink>
        <ButtonLink href="/account" variant="secondary">
          Account
        </ButtonLink>
      </div>
    </div>
  );
}
