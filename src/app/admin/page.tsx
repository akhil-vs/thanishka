"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdminResource } from "@/lib/admin/useAdminResource";
import { formatINR } from "@/lib/format";

type Dashboard = {
  stats: {
    products: number;
    activeProducts: number;
    totalUnits: number;
    lowStock: number;
    outOfStock: number;
    discounts: number;
    offers: number;
    heroSlides: number;
    revenueToday: number;
    revenue7d: number;
    ordersToday: number;
    orders7d: number;
    aov7d: number;
    openFulfilment: number;
    pendingPaymentHolds: number;
  };
  lowStock: Array<{
    id: string;
    name: string;
    slug: string;
    total: number;
  }>;
  openOrders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    customerName: string;
    createdAt: string;
  }>;
  recentMovements: Array<{
    id: string;
    productId: string;
    size: string;
    delta: number;
    quantityAfter: number;
    source: string;
    createdAt: string;
  }>;
};

export default function AdminDashboardPage() {
  const pathname = usePathname();
  const base = pathname.startsWith("/studio") ? "/studio" : "/admin";
  const stockHref = `${base}/stock`;
  const ordersHref = `${base}/orders`;
  const { data, error } = useAdminResource<Dashboard>("/api/admin/dashboard");

  if (error) {
    return <p className="text-sale">{error}</p>;
  }

  if (!data) {
    return <p className="font-serif text-muted">Loading dashboard…</p>;
  }

  const salesCards = [
    ["Revenue today", formatINR(data.stats.revenueToday)],
    ["Revenue 7d", formatINR(data.stats.revenue7d)],
    ["Orders today", String(data.stats.ordersToday)],
    ["AOV 7d", formatINR(data.stats.aov7d)],
    ["Open to fulfil", String(data.stats.openFulfilment)],
    ["Payment holds", String(data.stats.pendingPaymentHolds)],
  ] as const;

  const stockCards = [
    ["Products", data.stats.activeProducts],
    ["Units in stock", data.stats.totalUnits],
    ["Low stock", data.stats.lowStock],
    ["Out of stock", data.stats.outOfStock],
  ] as const;

  return (
    <div>
      <h1 className="font-display text-2xl tracking-[0.14em] md:text-3xl">
        Dashboard
      </h1>
      <p className="mt-2 font-serif text-muted">
        Boutique operations overview — sales, fulfilment, and Trivandrum stock.
      </p>

      <h2 className="mt-8 font-display text-[11px] tracking-[0.16em]">Sales</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {salesCards.map(([label, value]) => (
          <div key={label} className="border border-line bg-ivory p-4">
            <p className="font-display text-[10px] tracking-[0.16em] text-muted">
              {label}
            </p>
            <p className="mt-2 font-display text-2xl tracking-[0.08em]">
              {value}
            </p>
          </div>
        ))}
      </div>

      <h2 className="mt-10 font-display text-[11px] tracking-[0.16em]">
        Catalogue
      </h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stockCards.map(([label, value]) => (
          <div key={label} className="border border-line bg-ivory p-4">
            <p className="font-display text-[10px] tracking-[0.16em] text-muted">
              {label}
            </p>
            <p className="mt-2 font-display text-2xl tracking-[0.08em]">
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section className="border border-line bg-ivory p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-[11px] tracking-[0.16em]">
              Open fulfilment
            </h2>
            <Link
              href={ordersHref}
              className="font-display text-[10px] tracking-[0.14em] text-kasavu-deep"
            >
              Orders desk
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {data.openOrders.length === 0 ? (
              <li className="font-serif text-sm text-muted">
                Nothing waiting to pack or ship.
              </li>
            ) : (
              data.openOrders.map((order) => (
                <li
                  key={order.id}
                  className="flex items-center justify-between border-b border-line pb-2 text-sm"
                >
                  <span>
                    {order.orderNumber}
                    <span className="block text-xs text-muted">
                      {order.customerName} ·{" "}
                      {order.status.replaceAll("_", " ")}
                    </span>
                  </span>
                  <span className="font-display text-[10px] tracking-[0.12em]">
                    {formatINR(order.total)}
                  </span>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="border border-line bg-ivory p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-[11px] tracking-[0.16em]">
              Low stock
            </h2>
            <Link
              href={stockHref}
              className="font-display text-[10px] tracking-[0.14em] text-kasavu-deep"
            >
              Manage
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {data.lowStock.length === 0 ? (
              <li className="font-serif text-sm text-muted">All healthy.</li>
            ) : (
              data.lowStock.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between border-b border-line pb-2 text-sm"
                >
                  <span>{item.name}</span>
                  <span className="font-display text-[10px] tracking-[0.12em] text-sale">
                    {item.total} left
                  </span>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>

      <section className="mt-6 border border-line bg-ivory p-5">
        <h2 className="font-display text-[11px] tracking-[0.16em]">
          Recent stock moves
        </h2>
        <ul className="mt-4 space-y-3">
          {data.recentMovements.length === 0 ? (
            <li className="font-serif text-sm text-muted">No movements yet.</li>
          ) : (
            data.recentMovements.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between border-b border-line pb-2 text-sm"
              >
                <span>
                  {m.productId} · {m.size}
                  <span className="ml-2 text-xs text-muted">{m.source}</span>
                </span>
                <span className={m.delta >= 0 ? "text-emerald" : "text-sale"}>
                  {m.delta >= 0 ? "+" : ""}
                  {m.delta} → {m.quantityAfter}
                </span>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
