"use client";

import Link from "next/link";
import { useAdminResource } from "@/lib/admin/useAdminResource";

type PlatformOverview = {
  shop: {
    id: string;
    name: string;
    slug: string;
    active: boolean;
  };
  counts: {
    owners: number;
    staff: number;
    customers: number;
  };
};

type Dashboard = {
  stats: {
    activeProducts: number;
    totalUnits: number;
    lowStock: number;
    discounts: number;
    offers: number;
  };
};

export default function AdminOverviewPage() {
  const shop = useAdminResource<PlatformOverview>("/api/admin/shop");
  const ops = useAdminResource<Dashboard>("/api/admin/dashboard");

  if (shop.error) {
    return <p className="text-sale">{shop.error}</p>;
  }

  if (!shop.data) {
    return <p className="font-serif text-muted">Loading platform…</p>;
  }

  const { shop: boutique, counts } = shop.data;

  return (
    <div>
      <p className="font-display text-[10px] tracking-[0.2em] text-kasavu-deep">
        Platform control
      </p>
      <h1 className="mt-2 font-display text-2xl tracking-[0.14em] md:text-3xl">
        Overview
      </h1>
      <p className="mt-2 max-w-xl font-serif text-muted">
        Admin is for access, boutique settings, and system health — not daily
        stock intake. Run the floor from Studio.
      </p>

      <div className="mt-8 border border-charcoal/15 bg-ivory p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-display text-[10px] tracking-[0.16em] text-muted">
              Active boutique
            </p>
            <h2 className="mt-2 font-display text-xl tracking-[0.12em]">
              {boutique.name}
            </h2>
            <p className="mt-1 font-serif text-sm text-muted">
              /{boutique.slug} · {boutique.active ? "Live" : "Paused"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/shop"
              className="border border-line px-3 py-2 font-display text-[10px] tracking-[0.14em]"
            >
              Edit boutique
            </Link>
            <Link
              href="/studio"
              className="border border-charcoal bg-charcoal px-3 py-2 font-display text-[10px] tracking-[0.14em] text-ivory"
            >
              Open Studio
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          ["Shop owners", counts.owners, "/admin/access"],
          ["Shop staff", counts.staff, "/admin/access"],
          ["Customers", counts.customers, "/admin/access"],
        ].map(([label, value, href]) => (
          <Link
            key={label as string}
            href={href as string}
            className="border border-charcoal/15 bg-ivory p-4 transition-colors hover:border-charcoal/40"
          >
            <p className="font-display text-[10px] tracking-[0.16em] text-muted">
              {label}
            </p>
            <p className="mt-2 font-display text-2xl tracking-[0.08em]">
              {value as number}
            </p>
          </Link>
        ))}
      </div>

      <section className="mt-10 border border-charcoal/15 bg-ivory p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-[11px] tracking-[0.16em]">
            Floor snapshot
          </h2>
          <Link
            href="/studio"
            className="font-display text-[10px] tracking-[0.14em] text-kasavu-deep"
          >
            Manage in Studio
          </Link>
        </div>
        {ops.error ? (
          <p className="mt-4 text-sm text-sale">{ops.error}</p>
        ) : !ops.data ? (
          <p className="mt-4 font-serif text-sm text-muted">Loading…</p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              ["Products", ops.data.stats.activeProducts],
              ["Units", ops.data.stats.totalUnits],
              ["Low stock", ops.data.stats.lowStock],
              ["Coupons", ops.data.stats.discounts],
              ["Offers", ops.data.stats.offers],
            ].map(([label, value]) => (
              <div key={label as string}>
                <p className="font-display text-[9px] tracking-[0.14em] text-muted">
                  {label}
                </p>
                <p className="mt-1 font-display text-xl tracking-[0.08em]">
                  {value as number}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
