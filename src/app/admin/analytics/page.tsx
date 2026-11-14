"use client";

import { useMemo, useState } from "react";
import { formatINR, cn } from "@/lib/format";
import { useAdminResource } from "@/lib/admin/useAdminResource";

type Preset = "7d" | "30d" | "mtd" | "custom";

type AnalyticsPayload = {
  period: {
    range: { from: string; to: string };
    summary: {
      gmv: number;
      orders: number;
      aov: number;
      discountTotal: number;
      failRate: number;
      openFulfilment: number;
    };
    series: Array<{ date: string; gmv: number; orders: number }>;
    paymentMix: Array<{ method: string; orders: number; gmv: number }>;
    statusCounts: Array<{ status: string; count: number }>;
    topProducts: Array<{
      productId: string;
      name: string;
      units: number;
      gmv: number;
      share: number;
    }>;
    topCities: Array<{
      city: string;
      state: string;
      orders: number;
      gmv: number;
    }>;
    coupons: Array<{
      code: string;
      orders: number;
      gmv: number;
      discountTotal: number;
      aov: number;
    }>;
    feedback: { count: number; avgRating: number | null };
    newsletter: { signups: number; whatsappOptIns: number };
  };
  delta: {
    gmv: number | null;
    orders: number | null;
    aov: number | null;
    discountTotal: number | null;
    failRate: number | null;
  } | null;
};

function istTodayKey(d = new Date()) {
  const shifted = new Date(d.getTime() + (5 * 60 + 30) * 60 * 1000);
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const day = String(shifted.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDaysKey(key: string, days: number) {
  const [y, m, d] = key.split("-").map(Number);
  const utc = Date.UTC(y, m - 1, d) + days * 86400000;
  const dt = new Date(utc);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
}

function monthStartKey(key: string) {
  return `${key.slice(0, 7)}-01`;
}

function formatDelta(value: number | null | undefined, unit: "%" | "pp" = "%") {
  if (value == null) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value}${unit}`;
}

function deltaClass(
  value: number | null | undefined,
  invert = false,
) {
  if (value == null || value === 0) return "text-muted";
  const good = invert ? value < 0 : value > 0;
  return good ? "text-emerald" : "text-sale";
}

function TrendChart({
  series,
}: {
  series: Array<{ date: string; gmv: number; orders: number }>;
}) {
  const maxGmv = Math.max(...series.map((s) => s.gmv), 1);
  const width = 640;
  const height = 180;
  const padX = 8;
  const padY = 16;
  const barGap = series.length > 40 ? 1 : 4;
  const innerW = width - padX * 2;
  const barW = Math.max(2, (innerW - barGap * (series.length - 1)) / series.length);

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-44 w-full min-w-[320px]"
        role="img"
        aria-label="GMV by day"
      >
        {series.map((point, i) => {
          const h = (point.gmv / maxGmv) * (height - padY * 2);
          const x = padX + i * (barW + barGap);
          const y = height - padY - h;
          return (
            <rect
              key={point.date}
              x={x}
              y={y}
              width={barW}
              height={Math.max(h, point.gmv > 0 ? 2 : 0)}
              className="fill-kasavu-deep/80"
            >
              <title>
                {point.date}: {formatINR(point.gmv)} · {point.orders} orders
              </title>
            </rect>
          );
        })}
        <line
          x1={padX}
          x2={width - padX}
          y1={height - padY}
          y2={height - padY}
          className="stroke-line"
          strokeWidth={1}
        />
      </svg>
      <div className="mt-1 flex justify-between font-display text-[9px] tracking-[0.12em] text-muted">
        <span>{series[0]?.date}</span>
        <span>{series[series.length - 1]?.date}</span>
      </div>
    </div>
  );
}

function FunnelBar({
  rows,
}: {
  rows: Array<{ status: string; count: number }>;
}) {
  const max = Math.max(...rows.map((r) => r.count), 1);
  return (
    <ul className="space-y-2">
      {rows.map((row) => (
        <li key={row.status}>
          <div className="mb-1 flex justify-between font-display text-[9px] tracking-[0.12em]">
            <span>{row.status.replaceAll("_", " ")}</span>
            <span>{row.count}</span>
          </div>
          <div className="h-1.5 bg-sand">
            <div
              className="h-full bg-charcoal"
              style={{ width: `${(row.count / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function AdminAnalyticsPage() {
  const today = useMemo(() => istTodayKey(), []);
  const [preset, setPreset] = useState<Preset>("7d");
  const [from, setFrom] = useState(() => addDaysKey(today, -6));
  const [to, setTo] = useState(today);
  const [compare, setCompare] = useState(true);

  function applyPreset(next: Preset) {
    setPreset(next);
    if (next === "7d") {
      setFrom(addDaysKey(today, -6));
      setTo(today);
    } else if (next === "30d") {
      setFrom(addDaysKey(today, -29));
      setTo(today);
    } else if (next === "mtd") {
      setFrom(monthStartKey(today));
      setTo(today);
    }
  }

  const path = useMemo(() => {
    const params = new URLSearchParams({
      from,
      to,
      compare: compare ? "1" : "0",
    });
    return `/api/admin/analytics?${params}`;
  }, [from, to, compare]);

  const { data, error } = useAdminResource<AnalyticsPayload>(path);

  const period = data?.period;
  const delta = data?.delta;
  const summary = period?.summary;

  const funnelOrder = [
    "PENDING_PAYMENT",
    "PAID",
    "COD_CONFIRMED",
    "PACKED",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
    "PAYMENT_FAILED",
  ] as const;

  const statusRows =
    period?.statusCounts
      .slice()
      .sort(
        (a, b) =>
          funnelOrder.indexOf(a.status as (typeof funnelOrder)[number]) -
          funnelOrder.indexOf(b.status as (typeof funnelOrder)[number]),
      )
      .filter((r) => r.count > 0) ?? [];

  return (
    <div>
      <h1 className="font-display text-2xl tracking-[0.14em] md:text-3xl">
        Analytics
      </h1>
      <p className="mt-2 font-serif text-muted">
        Sales trends and merch performance — days in IST (Asia/Kolkata).
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {(
          [
            ["7d", "7 days"],
            ["30d", "30 days"],
            ["mtd", "MTD"],
            ["custom", "Custom"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => applyPreset(key)}
            className={cn(
              "border px-3 py-1.5 font-display text-[9px] tracking-[0.14em]",
              preset === key
                ? "border-charcoal bg-charcoal text-ivory"
                : "border-line bg-ivory",
            )}
          >
            {label}
          </button>
        ))}
        <label className="ml-2 flex items-center gap-2 font-display text-[9px] tracking-[0.14em] text-muted">
          <input
            type="checkbox"
            checked={compare}
            onChange={(e) => setCompare(e.target.checked)}
            className="accent-charcoal"
          />
          Compare prior period
        </label>
      </div>

      {preset === "custom" ? (
        <div className="mt-3 flex flex-wrap gap-3">
          <label className="font-display text-[9px] tracking-[0.14em] text-muted">
            From
            <input
              type="date"
              value={from}
              max={to}
              onChange={(e) => {
                setFrom(e.target.value);
                setPreset("custom");
              }}
              className="ml-2 border border-line bg-ivory px-2 py-1.5 text-charcoal"
            />
          </label>
          <label className="font-display text-[9px] tracking-[0.14em] text-muted">
            To
            <input
              type="date"
              value={to}
              min={from}
              max={today}
              onChange={(e) => {
                setTo(e.target.value);
                setPreset("custom");
              }}
              className="ml-2 border border-line bg-ivory px-2 py-1.5 text-charcoal"
            />
          </label>
        </div>
      ) : null}

      {error ? <p className="mt-4 text-sm text-sale">{error}</p> : null}

      {!data && !error ? (
        <p className="mt-8 font-serif text-muted">Loading analytics…</p>
      ) : null}

      {summary && period ? (
        <>
          <h2 className="mt-8 font-display text-[11px] tracking-[0.16em]">
            Summary · {period.range.from} → {period.range.to}
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(
              [
                ["GMV", formatINR(summary.gmv), delta?.gmv, "%" as const, false],
                ["Orders", String(summary.orders), delta?.orders, "%" as const, false],
                ["AOV", formatINR(summary.aov), delta?.aov, "%" as const, false],
                [
                  "Discount given",
                  formatINR(summary.discountTotal),
                  delta?.discountTotal,
                  "%" as const,
                  false,
                ],
                [
                  "Fail / cancel rate",
                  `${summary.failRate}%`,
                  delta?.failRate,
                  "pp" as const,
                  true,
                ],
                [
                  "Open to fulfil",
                  String(summary.openFulfilment),
                  null,
                  "%" as const,
                  false,
                ],
              ] as const
            ).map(([label, value, d, unit, invert]) => (
              <div key={label} className="border border-line bg-ivory p-4">
                <p className="font-display text-[10px] tracking-[0.16em] text-muted">
                  {label}
                </p>
                <p className="mt-2 font-display text-2xl tracking-[0.08em]">
                  {value}
                </p>
                {compare && d !== null ? (
                  <p
                    className={cn(
                      "mt-1 font-display text-[10px] tracking-[0.12em]",
                      deltaClass(d, invert),
                    )}
                  >
                    {formatDelta(d, unit)} vs prior
                  </p>
                ) : null}
              </div>
            ))}
          </div>

          <section className="mt-10 border border-line bg-ivory p-5">
            <h2 className="font-display text-[11px] tracking-[0.16em]">
              GMV by day
            </h2>
            <p className="mt-1 font-serif text-sm text-muted">
              Attributed by paidAt when set, otherwise createdAt (COD).
            </p>
            <div className="mt-4">
              <TrendChart series={period.series} />
            </div>
          </section>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <section className="border border-line bg-ivory p-5">
              <h2 className="font-display text-[11px] tracking-[0.16em]">
                Payment mix
              </h2>
              <ul className="mt-4 space-y-3">
                {period.paymentMix.map((row) => (
                  <li
                    key={row.method}
                    className="flex items-center justify-between border-b border-line pb-2 text-sm"
                  >
                    <span>
                      {row.method}
                      <span className="block text-xs text-muted">
                        {row.orders} orders
                      </span>
                    </span>
                    <span className="font-display text-[10px] tracking-[0.12em]">
                      {formatINR(row.gmv)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="border border-line bg-ivory p-5">
              <h2 className="font-display text-[11px] tracking-[0.16em]">
                Status funnel
              </h2>
              <p className="mt-1 font-serif text-xs text-muted">
                Orders created in range, by current status.
              </p>
              <div className="mt-4">
                {statusRows.length === 0 ? (
                  <p className="font-serif text-sm text-muted">No orders in range.</p>
                ) : (
                  <FunnelBar rows={statusRows} />
                )}
              </div>
            </section>
          </div>

          <section className="mt-6 border border-line bg-ivory p-5">
            <h2 className="font-display text-[11px] tracking-[0.16em]">
              Bestsellers
            </h2>
            {period.topProducts.length === 0 ? (
              <p className="mt-4 font-serif text-sm text-muted">
                No revenue lines in this range.
              </p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[480px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-line font-display text-[9px] tracking-[0.14em] text-muted">
                      <th className="pb-2 font-normal">Product</th>
                      <th className="pb-2 font-normal">Units</th>
                      <th className="pb-2 font-normal">GMV</th>
                      <th className="pb-2 font-normal">Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {period.topProducts.map((p) => (
                      <tr key={p.productId} className="border-b border-line">
                        <td className="py-2.5">{p.name}</td>
                        <td className="py-2.5">{p.units}</td>
                        <td className="py-2.5 font-display text-[10px] tracking-[0.12em]">
                          {formatINR(p.gmv)}
                        </td>
                        <td className="py-2.5">{p.share}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <section className="border border-line bg-ivory p-5">
              <h2 className="font-display text-[11px] tracking-[0.16em]">
                Top cities
              </h2>
              {period.topCities.length === 0 ? (
                <p className="mt-4 font-serif text-sm text-muted">No shipments yet.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {period.topCities.map((c) => (
                    <li
                      key={`${c.city}-${c.state}`}
                      className="flex items-center justify-between border-b border-line pb-2 text-sm"
                    >
                      <span>
                        {c.city}
                        {c.state ? (
                          <span className="block text-xs text-muted">{c.state}</span>
                        ) : null}
                      </span>
                      <span className="text-right">
                        <span className="block font-display text-[10px] tracking-[0.12em]">
                          {formatINR(c.gmv)}
                        </span>
                        <span className="text-xs text-muted">{c.orders} orders</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="border border-line bg-ivory p-5">
              <h2 className="font-display text-[11px] tracking-[0.16em]">
                Coupons
              </h2>
              {period.coupons.length === 0 ? (
                <p className="mt-4 font-serif text-sm text-muted">
                  No couponed orders in range.
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {period.coupons.map((c) => (
                    <li
                      key={c.code}
                      className="flex items-center justify-between border-b border-line pb-2 text-sm"
                    >
                      <span>
                        {c.code}
                        <span className="block text-xs text-muted">
                          {c.orders} orders · AOV {formatINR(c.aov)}
                        </span>
                      </span>
                      <span className="text-right">
                        <span className="block font-display text-[10px] tracking-[0.12em]">
                          {formatINR(c.gmv)}
                        </span>
                        <span className="text-xs text-muted">
                          −{formatINR(c.discountTotal)}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <section className="border border-line bg-ivory p-5">
              <h2 className="font-display text-[11px] tracking-[0.16em]">
                Feedback
              </h2>
              <p className="mt-3 font-display text-2xl tracking-[0.08em]">
                {period.feedback.avgRating != null
                  ? `${period.feedback.avgRating} / 5`
                  : "—"}
              </p>
              <p className="mt-1 font-serif text-sm text-muted">
                {period.feedback.count} reviews in range
              </p>
            </section>
            <section className="border border-line bg-ivory p-5">
              <h2 className="font-display text-[11px] tracking-[0.16em]">
                Newsletter
              </h2>
              <p className="mt-3 font-display text-2xl tracking-[0.08em]">
                {period.newsletter.signups}
              </p>
              <p className="mt-1 font-serif text-sm text-muted">
                signups · {period.newsletter.whatsappOptIns} WhatsApp opt-in
              </p>
            </section>
          </div>
        </>
      ) : null}
    </div>
  );
}
