"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatINR } from "@/lib/format";
import { adminFetch } from "@/lib/admin/client";
import { useAdminResource } from "@/lib/admin/useAdminResource";
import type { SerializedOrder } from "@/lib/checkout/types";

const STATUS_FILTERS = [
  "ALL",
  "PENDING_PAYMENT",
  "PAID",
  "COD_CONFIRMED",
  "PACKED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "PAYMENT_FAILED",
] as const;

const NEXT_ACTIONS: Record<string, Array<"PACKED" | "SHIPPED" | "DELIVERED" | "CANCELLED">> = {
  PAID: ["PACKED", "CANCELLED"],
  COD_CONFIRMED: ["PACKED", "CANCELLED"],
  PACKED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  PENDING_PAYMENT: ["CANCELLED"],
  PAYMENT_FAILED: ["CANCELLED"],
};

export default function AdminOrdersPage() {
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>("ALL");
  const path = useMemo(
    () =>
      status === "ALL"
        ? "/api/admin/orders?limit=60"
        : `/api/admin/orders?limit=60&status=${status}`,
    [status],
  );
  const { data, error, setError, reload } = useAdminResource<{
    orders: SerializedOrder[];
    counts: Record<string, number>;
  }>(path);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const orders = data?.orders ?? [];
  const counts = data?.counts ?? {};

  async function setOrderStatus(
    orderId: string,
    next: "PACKED" | "SHIPPED" | "DELIVERED" | "CANCELLED",
  ) {
    setBusyId(orderId);
    setError("");
    setMessage("");
    try {
      await adminFetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });
      setMessage(`Updated to ${next}`);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <h2 className="font-display text-2xl tracking-[0.14em]">Orders</h2>
      <p className="mt-2 font-serif text-sm text-muted">
        Fulfil prepaid and COD orders. Cancelling unpaid or packed orders
        releases held stock.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={`border px-3 py-1.5 font-display text-[9px] tracking-[0.14em] ${
              status === s
                ? "border-charcoal bg-charcoal text-ivory"
                : "border-line bg-ivory"
            }`}
          >
            {s === "ALL" ? "All" : s.replaceAll("_", " ")}
            {s !== "ALL" && counts[s] != null ? ` (${counts[s]})` : ""}
          </button>
        ))}
      </div>

      {error ? <p className="mt-4 text-sm text-sale">{error}</p> : null}
      {message ? <p className="mt-4 text-sm text-emerald">{message}</p> : null}

      <div className="mt-6 space-y-4">
        {orders.length === 0 ? (
          <p className="border border-line bg-ivory p-6 font-serif text-sm text-muted">
            No orders in this view yet.
          </p>
        ) : (
          orders.map((order) => {
            const actions = NEXT_ACTIONS[order.status] ?? [];
            return (
              <article
                key={order.id}
                className="border border-line bg-ivory p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-[11px] tracking-[0.16em]">
                      {order.orderNumber}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {order.status.replaceAll("_", " ")} ·{" "}
                      {order.paymentMethod}
                      {order.razorpayPaymentId
                        ? ` · ${order.razorpayPaymentId}`
                        : ""}
                    </p>
                    <p className="mt-2 font-serif text-sm">
                      {order.customerName} · {order.customerPhone}
                      {order.customerEmail ? ` · ${order.customerEmail}` : ""}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {order.shipping.line1}
                      {order.shipping.line2 ? `, ${order.shipping.line2}` : ""}
                      , {order.shipping.city}, {order.shipping.state}{" "}
                      {order.shipping.postalCode}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-[11px] tracking-[0.14em]">
                      {formatINR(order.total)}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {new Date(order.createdAt).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>

                <ul className="mt-4 space-y-1 border-t border-line pt-3 text-sm">
                  {order.items.map((item) => (
                    <li key={item.id} className="flex justify-between gap-3">
                      <span>
                        {item.name} · {item.size} × {item.quantity}
                      </span>
                      <span>{formatINR(item.lineTotal)}</span>
                    </li>
                  ))}
                </ul>

                {actions.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {actions.map((action) => (
                      <Button
                        key={action}
                        type="button"
                        variant={
                          action === "CANCELLED" ? "secondary" : "primary"
                        }
                        className="px-3 py-2 text-[10px]"
                        disabled={busyId === order.id}
                        onClick={() => setOrderStatus(order.id, action)}
                      >
                        {action === "CANCELLED" ? "Cancel / restock" : action}
                      </Button>
                    ))}
                  </div>
                ) : null}
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
