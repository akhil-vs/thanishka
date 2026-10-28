"use client";

import Link from "next/link";
import { useAdminResource } from "@/lib/admin/useAdminResource";

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
  };
  lowStock: Array<{
    id: string;
    name: string;
    slug: string;
    total: number;
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
  const { data, error } = useAdminResource<Dashboard>("/api/admin/dashboard");

  if (error) {
    return <p className="text-sale">{error}</p>;
  }

  if (!data) {
    return <p className="font-serif text-muted">Loading dashboard…</p>;
  }

  const cards = [
    ["Products", data.stats.activeProducts],
    ["Units in stock", data.stats.totalUnits],
    ["Low stock", data.stats.lowStock],
    ["Out of stock", data.stats.outOfStock],
    ["Discounts", data.stats.discounts],
    ["Offers", data.stats.offers],
    ["Hero slides", data.stats.heroSlides],
  ] as const;

  return (
    <div>
      <h1 className="font-display text-2xl tracking-[0.14em] md:text-3xl">
        Dashboard
      </h1>
      <p className="mt-2 font-serif text-muted">
        Boutique operations overview for Trivandrum stock and campaigns.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([label, value]) => (
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
              Low stock
            </h2>
            <Link
              href="/admin/stock"
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

        <section className="border border-line bg-ivory p-5">
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
    </div>
  );
}
