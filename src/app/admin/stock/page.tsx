"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowDownToLine,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Minus,
  PackageX,
  Plus,
  Search,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { adminFetch } from "@/lib/admin/client";
import { SIZE_KEYS, type SizeKey } from "@/lib/admin/stock";
import { useAdminResource } from "@/lib/admin/useAdminResource";
import { cn, formatINR } from "@/lib/format";

type StockRow = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  category: string;
  categorySlug: string;
  price: number;
  image: string | null;
  sizes: Record<string, number>;
  total: number;
};

type StockResponse = {
  stock: StockRow[];
  movements: Array<{
    id: string;
    productId: string;
    size: string;
    delta: number;
    quantityAfter: number;
    note: string | null;
    source: string;
    createdAt: string;
  }>;
  summary: {
    activeStyles: number;
    totalUnits: number;
    lowStock: number;
    outOfStock: number;
    retailValue: number;
    lowStockThreshold: number;
  };
};

type BulkLine = {
  productId: string;
  size: SizeKey;
  delta: number;
};

type FilterTab = "all" | "low" | "out" | string;

const PAGE_SIZE = 8;
const SIZE_ALERT = 2;

function stockStatus(
  total: number,
  threshold: number,
): "out" | "low" | "healthy" {
  if (total <= 0) return "out";
  if (total <= threshold) return "low";
  return "healthy";
}

function statusLabel(status: "out" | "low" | "healthy") {
  if (status === "out") return "Out of stock";
  if (status === "low") return "Low stock";
  return "Healthy";
}

export default function AdminStockPage() {
  const { data, error, setError, reload } =
    useAdminResource<StockResponse>("/api/admin/stock");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterTab>("all");
  const [page, setPage] = useState(1);
  const [single, setSingle] = useState({
    productId: "",
    size: "M" as SizeKey,
    mode: "adjust" as "adjust" | "set",
    value: 1,
    note: "",
  });
  const [bulkText, setBulkText] = useState(
    "# productId,size,delta\n# example: clxyz...,M,5",
  );
  const [bulkNote, setBulkNote] = useState("Bulk intake");
  const fileRef = useRef<HTMLInputElement>(null);
  const adjustRef = useRef<HTMLFormElement>(null);

  const threshold = data?.summary.lowStockThreshold ?? 5;
  const selectedProductId = single.productId || data?.stock[0]?.id || "";

  const selectedProduct = useMemo(
    () => data?.stock.find((p) => p.id === selectedProductId) ?? null,
    [data, selectedProductId],
  );

  const nameById = useMemo(() => {
    const map = new Map<string, string>();
    data?.stock.forEach((s) => map.set(s.id, s.name));
    return map;
  }, [data]);

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    data?.stock.forEach((s) => {
      if (s.active) map.set(s.categorySlug, s.category);
    });
    return Array.from(map.entries()).sort((a, b) =>
      a[1].localeCompare(b[1]),
    );
  }, [data]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data?.stock ?? []).filter((row) => {
      if (!row.active && filter !== "all") return false;

      if (filter === "low") {
        if (stockStatus(row.total, threshold) !== "low") return false;
      } else if (filter === "out") {
        if (stockStatus(row.total, threshold) !== "out") return false;
      } else if (filter !== "all") {
        if (row.categorySlug !== filter) return false;
      }

      if (!q) return true;
      return (
        row.name.toLowerCase().includes(q) ||
        row.id.toLowerCase().includes(q) ||
        row.slug.toLowerCase().includes(q) ||
        SIZE_KEYS.some((size) => size.toLowerCase() === q)
      );
    });
  }, [data, filter, query, threshold]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageRows = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const currentSizeQty = selectedProduct?.sizes[single.size] ?? 0;
  const previewQty =
    single.mode === "set"
      ? Math.max(0, single.value)
      : Math.max(0, currentSizeQty + single.value);

  async function submitSingle(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    try {
      await adminFetch("/api/admin/stock", {
        method: "PATCH",
        body: JSON.stringify({
          productId: selectedProductId,
          size: single.size,
          mode: single.mode,
          note: single.note || undefined,
          ...(single.mode === "set"
            ? { quantity: single.value }
            : { delta: single.value }),
        }),
      });
      setMessage("Stock updated.");
      setSingle((s) => ({ ...s, note: "", value: s.mode === "set" ? s.value : 1 }));
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  function parseBulk(text: string): BulkLine[] {
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#"));

    return lines.map((line, index) => {
      const [productId, sizeRaw, deltaRaw] = line
        .split(/[,\t ]+/)
        .map((p) => p.trim());
      const size = sizeRaw?.toUpperCase() as SizeKey;
      if (!productId || !SIZE_KEYS.includes(size)) {
        throw new Error(`Invalid row ${index + 1}: ${line}`);
      }
      const delta = Number(deltaRaw);
      if (!Number.isInteger(delta)) {
        throw new Error(`Invalid delta on row ${index + 1}`);
      }
      return { productId, size, delta };
    });
  }

  async function submitBulk(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const items = parseBulk(bulkText).map((item) => ({
        productId: item.productId,
        size: item.size,
        mode: "adjust" as const,
        delta: item.delta,
      }));
      const res = await adminFetch<{ count: number }>("/api/admin/stock/bulk", {
        method: "POST",
        body: JSON.stringify({ note: bulkNote, items }),
      });
      setMessage(`Bulk applied to ${res.count} size rows.`);
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bulk failed");
    } finally {
      setBusy(false);
    }
  }

  function onCsvFile(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      setBulkText(text.trim() || bulkText);
      setMessage(`Loaded ${file.name}`);
    };
    reader.onerror = () => setError("Could not read file");
    reader.readAsText(file);
  }

  function focusAdjust(productId: string, size?: SizeKey) {
    setSingle((s) => ({
      ...s,
      productId,
      size: size ?? s.size,
      mode: "adjust",
      value: 1,
    }));
    adjustRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (!data && !error) {
    return <p className="font-serif text-muted">Loading stock…</p>;
  }

  const summary = data?.summary;
  const tabs: Array<{ id: FilterTab; label: string; count?: number }> = [
    { id: "all", label: "All", count: data?.stock.filter((s) => s.active).length },
    { id: "low", label: "Low stock", count: summary?.lowStock },
    { id: "out", label: "Out of stock", count: summary?.outOfStock },
    ...categories.map(([slug, label]) => ({ id: slug, label })),
  ];

  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(safePage * PAGE_SIZE, filtered.length);
  const maxTotal = Math.max(...filtered.map((r) => r.total), 1);

  return (
    <div>
      <header className="flex flex-col gap-4 border-b border-line pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-2xl tracking-[0.14em] md:text-3xl">
            Stock & inventory
          </h1>
          <p className="mt-2 max-w-2xl font-serif text-sm text-muted">
            Adjust sizes, run warehouse intake, and review movement history.
            Low stock is total units ≤ {threshold}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            className="px-4 py-2.5"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-3.5 w-3.5" />
            Import CSV
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="px-4 py-2.5"
            onClick={() =>
              document
                .getElementById("stock-audit-log")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Audit log
          </Button>
        </div>
      </header>

      {error ? <p className="mt-4 text-sm text-sale">{error}</p> : null}
      {message ? <p className="mt-4 text-sm text-emerald">{message}</p> : null}

      {summary ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Units in stock"
            value={summary.totalUnits.toLocaleString("en-IN")}
            hint={`${summary.activeStyles} active styles`}
          />
          <StatCard
            label="Low stock"
            value={String(summary.lowStock)}
            hint={`≤ ${threshold} units remaining`}
            tone={summary.lowStock > 0 ? "warn" : "default"}
          />
          <StatCard
            label="Out of stock"
            value={String(summary.outOfStock)}
            hint="Styles with zero units"
            tone={summary.outOfStock > 0 ? "danger" : "default"}
          />
          <StatCard
            label="Retail inventory value"
            value={formatINR(summary.retailValue)}
            hint="Price × units on hand"
          />
        </div>
      ) : null}

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <form
          ref={adjustRef}
          onSubmit={submitSingle}
          className="flex flex-col border border-line bg-ivory"
        >
          <div className="border-b border-line px-5 py-4">
            <h2 className="font-display text-[11px] tracking-[0.16em]">
              Single size adjustment
            </h2>
            <p className="mt-1 text-xs text-muted">
              Change one SKU size with an optional audit note.
            </p>
          </div>

          <div className="flex flex-1 flex-col gap-4 p-5">
            <label className="block text-sm">
              <span className="mb-1.5 block font-display text-[9px] tracking-[0.14em] text-muted">
                Product
              </span>
              <select
                value={selectedProductId}
                onChange={(e) =>
                  setSingle((s) => ({ ...s, productId: e.target.value }))
                }
                className="w-full border border-line bg-transparent px-3 py-2.5 text-sm"
              >
                {data?.stock.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {!p.active ? " (inactive)" : ""}
                  </option>
                ))}
              </select>
            </label>

            {selectedProduct ? (
              <div className="flex items-center gap-3 border border-line bg-mist/50 p-3">
                <ProductThumb src={selectedProduct.image} alt={selectedProduct.name} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {selectedProduct.name}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {formatINR(selectedProduct.price)} · {selectedProduct.category}
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] text-muted">
                    {selectedProduct.id}
                  </p>
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                <span className="mb-1.5 block font-display text-[9px] tracking-[0.14em] text-muted">
                  Size
                </span>
                <select
                  value={single.size}
                  onChange={(e) =>
                    setSingle((s) => ({
                      ...s,
                      size: e.target.value as SizeKey,
                    }))
                  }
                  className="w-full border border-line bg-transparent px-3 py-2.5 text-sm"
                >
                  {SIZE_KEYS.map((size) => (
                    <option key={size} value={size}>
                      {size} (now {selectedProduct?.sizes[size] ?? 0})
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block font-display text-[9px] tracking-[0.14em] text-muted">
                  Mode
                </span>
                <select
                  value={single.mode}
                  onChange={(e) =>
                    setSingle((s) => ({
                      ...s,
                      mode: e.target.value as "adjust" | "set",
                      value: e.target.value === "set" ? currentSizeQty : 1,
                    }))
                  }
                  className="w-full border border-line bg-transparent px-3 py-2.5 text-sm"
                >
                  <option value="adjust">Adjust ±</option>
                  <option value="set">Set exact</option>
                </select>
              </label>
            </div>

            <div>
              <span className="mb-1.5 block font-display text-[9px] tracking-[0.14em] text-muted">
                {single.mode === "set" ? "New quantity" : "Adjustment"}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Decrease"
                  className="flex h-10 w-10 items-center justify-center border border-line hover:bg-sand/50"
                  onClick={() =>
                    setSingle((s) => ({
                      ...s,
                      value:
                        s.mode === "set"
                          ? Math.max(0, s.value - 1)
                          : s.value - 1,
                    }))
                  }
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <input
                  type="number"
                  value={single.value}
                  onChange={(e) =>
                    setSingle((s) => ({
                      ...s,
                      value: Number(e.target.value),
                    }))
                  }
                  className="h-10 w-full border border-line bg-transparent px-3 text-center text-sm tabular-nums"
                />
                <button
                  type="button"
                  aria-label="Increase"
                  className="flex h-10 w-10 items-center justify-center border border-line hover:bg-sand/50"
                  onClick={() =>
                    setSingle((s) => ({ ...s, value: s.value + 1 }))
                  }
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="mt-2 text-xs text-muted">
                {single.size}: {currentSizeQty} →{" "}
                <span className="text-charcoal">{previewQty}</span> units
              </p>
            </div>

            <label className="block text-sm">
              <span className="mb-1.5 block font-display text-[9px] tracking-[0.14em] text-muted">
                Audit note
              </span>
              <input
                value={single.note}
                onChange={(e) =>
                  setSingle((s) => ({ ...s, note: e.target.value }))
                }
                placeholder="Optional reason for this change"
                className="w-full border border-line bg-transparent px-3 py-2.5 text-sm"
              />
            </label>

            <Button type="submit" className="mt-auto w-full" disabled={busy}>
              Commit stock change
            </Button>
          </div>
        </form>

        <form
          onSubmit={submitBulk}
          className="flex flex-col border border-line bg-ivory"
        >
          <div className="border-b border-line px-5 py-4">
            <h2 className="font-display text-[11px] tracking-[0.16em]">
              Bulk warehouse intake
            </h2>
            <p className="mt-1 text-xs text-muted">
              One row per size: <code>productId,size,delta</code>
            </p>
          </div>

          <div className="flex flex-1 flex-col gap-4 p-5">
            <label className="block flex-1 text-sm">
              <span className="mb-1.5 block font-display text-[9px] tracking-[0.14em] text-muted">
                Batch payload
              </span>
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                rows={10}
                spellCheck={false}
                className="w-full border border-line bg-mist/40 px-3 py-2 font-mono text-xs leading-relaxed"
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1.5 block font-display text-[9px] tracking-[0.14em] text-muted">
                Batch reference
              </span>
              <input
                value={bulkNote}
                onChange={(e) => setBulkNote(e.target.value)}
                placeholder="e.g. WH-INTAKE-2025-04B"
                className="w-full border border-line bg-transparent px-3 py-2.5 text-sm"
              />
            </label>

            <input
              ref={fileRef}
              type="file"
              accept=".csv,.txt,text/csv,text/plain"
              className="hidden"
              onChange={(e) => {
                onCsvFile(e.target.files?.[0] ?? null);
                e.target.value = "";
              }}
            />

            <div className="mt-auto flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => fileRef.current?.click()}
              >
                <ArrowDownToLine className="h-3.5 w-3.5" />
                Attach CSV
              </Button>
              <Button type="submit" variant="gold" className="flex-1" disabled={busy}>
                Execute bulk intake
              </Button>
            </div>
          </div>
        </form>
      </div>

      <section className="mt-8 border border-line bg-ivory">
        <div className="flex flex-col gap-4 border-b border-line px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-display text-[11px] tracking-[0.16em]">
              Live inventory matrix
            </h2>
            <p className="mt-1 text-xs text-muted">
              Size cells ≤ {SIZE_ALERT} are highlighted. Click + to adjust.
            </p>
          </div>
          <label className="relative block w-full lg:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Filter by name, ID or size…"
              className="w-full border border-line bg-transparent py-2.5 pl-9 pr-3 text-sm"
            />
          </label>
        </div>

        <div className="flex gap-2 overflow-x-auto border-b border-line px-5 py-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setFilter(tab.id);
                setPage(1);
              }}
              className={cn(
                "whitespace-nowrap border px-3 py-1.5 font-display text-[9px] tracking-[0.14em] transition-colors",
                filter === tab.id
                  ? "border-charcoal bg-charcoal text-ivory"
                  : "border-line bg-transparent text-muted hover:border-charcoal/40 hover:text-charcoal",
              )}
            >
              {tab.label}
              {tab.count != null ? ` (${tab.count})` : ""}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-line bg-mist/40 font-display text-[10px] tracking-[0.14em] text-muted">
              <tr>
                <th className="px-5 py-3 font-normal">Garment</th>
                {SIZE_KEYS.map((size) => (
                  <th key={size} className="px-2 py-3 text-center font-normal">
                    {size}
                  </th>
                ))}
                <th className="px-3 py-3 font-normal">Total</th>
                <th className="px-3 py-3 font-normal">Status</th>
                <th className="px-5 py-3 text-right font-normal">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={SIZE_KEYS.length + 4}
                    className="px-5 py-10 text-center font-serif text-muted"
                  >
                    No garments match this filter.
                  </td>
                </tr>
              ) : (
                pageRows.map((row) => {
                  const status = stockStatus(row.total, threshold);
                  return (
                    <tr
                      key={row.id}
                      className="border-b border-line/70 last:border-b-0"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <ProductThumb src={row.image} alt={row.name} />
                          <div className="min-w-0">
                            <div className="truncate font-medium">{row.name}</div>
                            <div className="mt-0.5 text-xs text-muted">
                              {row.category}
                              {!row.active ? " · inactive" : ""}
                            </div>
                            <div className="mt-0.5 font-mono text-[10px] text-muted">
                              {row.id.length > 14
                                ? `${row.id.slice(0, 12)}…`
                                : row.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      {SIZE_KEYS.map((size) => {
                        const qty = row.sizes[size] ?? 0;
                        const alert = qty <= SIZE_ALERT;
                        return (
                          <td key={size} className="px-2 py-3 text-center">
                            <button
                              type="button"
                              title={`Adjust ${size}`}
                              onClick={() => focusAdjust(row.id, size)}
                              className={cn(
                                "inline-flex min-w-[2rem] items-center justify-center px-1.5 py-1 font-mono text-xs tabular-nums transition-colors",
                                qty === 0
                                  ? "bg-sale/10 text-sale"
                                  : alert
                                    ? "bg-kasavu/20 text-kasavu-deep"
                                    : "hover:bg-sand/60",
                              )}
                            >
                              {qty}
                            </button>
                          </td>
                        );
                      })}
                      <td className="px-3 py-3">
                        <div className="font-mono text-sm tabular-nums">
                          {row.total}
                        </div>
                        <div className="mt-1 h-1 w-16 overflow-hidden bg-sand">
                          <div
                            className={cn(
                              "h-full",
                              status === "out"
                                ? "bg-sale"
                                : status === "low"
                                  ? "bg-kasavu"
                                  : "bg-charcoal/70",
                            )}
                            style={{
                              width: `${Math.min(100, (row.total / maxTotal) * 100)}%`,
                            }}
                          />
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge status={status} />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          type="button"
                          aria-label={`Adjust ${row.name}`}
                          onClick={() => focusAdjust(row.id)}
                          className="inline-flex h-8 w-8 items-center justify-center border border-line text-muted hover:border-charcoal hover:text-charcoal"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-line px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted">
            {rangeStart}–{rangeEnd} of {filtered.length} styles
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex h-8 items-center gap-1 border border-line px-2.5 font-display text-[9px] tracking-[0.14em] disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Prev
            </button>
            {Array.from({ length: pageCount }, (_, i) => i + 1)
              .filter(
                (n) =>
                  n === 1 ||
                  n === pageCount ||
                  Math.abs(n - safePage) <= 1,
              )
              .map((n, idx, arr) => {
                const prev = arr[idx - 1];
                return (
                  <span key={n} className="contents">
                    {prev != null && n - prev > 1 ? (
                      <span className="px-1 text-xs text-muted">…</span>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setPage(n)}
                      className={cn(
                        "inline-flex h-8 min-w-8 items-center justify-center border px-2 font-display text-[9px] tracking-[0.14em]",
                        n === safePage
                          ? "border-charcoal bg-charcoal text-ivory"
                          : "border-line",
                      )}
                    >
                      {n}
                    </button>
                  </span>
                );
              })}
            <button
              type="button"
              disabled={safePage >= pageCount}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              className="inline-flex h-8 items-center gap-1 border border-line px-2.5 font-display text-[9px] tracking-[0.14em] disabled:opacity-40"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </section>

      <section
        id="stock-audit-log"
        className="mt-8 border border-line bg-ivory"
      >
        <div className="border-b border-line px-5 py-4">
          <h2 className="font-display text-[11px] tracking-[0.16em]">
            Movement audit log
          </h2>
          <p className="mt-1 text-xs text-muted">
            Latest {data?.movements.length ?? 0} stock changes across sources.
          </p>
        </div>
        <ul className="divide-y divide-line">
          {(data?.movements.length ?? 0) === 0 ? (
            <li className="px-5 py-8 text-center font-serif text-sm text-muted">
              No movements recorded yet.
            </li>
          ) : (
            data?.movements.map((m) => (
              <li
                key={m.id}
                className="flex flex-wrap items-start justify-between gap-3 px-5 py-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium">
                    {nameById.get(m.productId) ?? m.productId}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    Size {m.size} · {m.source}
                    {m.note ? ` · ${m.note}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={cn(
                      "font-mono text-sm tabular-nums",
                      m.delta < 0 ? "text-sale" : "text-emerald",
                    )}
                  >
                    {m.delta >= 0 ? "+" : ""}
                    {m.delta} → {m.quantityAfter}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {new Date(m.createdAt).toLocaleString("en-IN")}
                  </p>
                </div>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "default" | "warn" | "danger";
}) {
  return (
    <div className="border border-line bg-ivory p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="font-display text-[10px] tracking-[0.16em] text-muted">
          {label}
        </p>
        {tone === "warn" ? (
          <AlertTriangle className="h-3.5 w-3.5 text-kasavu-deep" />
        ) : null}
        {tone === "danger" ? (
          <PackageX className="h-3.5 w-3.5 text-sale" />
        ) : null}
      </div>
      <p className="mt-2 font-display text-2xl tracking-[0.08em]">{value}</p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: "out" | "low" | "healthy" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border px-2 py-1 font-display text-[9px] tracking-[0.12em]",
        status === "out" && "border-sale/30 bg-sale/10 text-sale",
        status === "low" && "border-kasavu/40 bg-kasavu/15 text-kasavu-deep",
        status === "healthy" && "border-line bg-mist/60 text-muted",
      )}
    >
      {status === "healthy" ? (
        <CheckCircle2 className="h-3 w-3" />
      ) : status === "low" ? (
        <AlertTriangle className="h-3 w-3" />
      ) : (
        <PackageX className="h-3 w-3" />
      )}
      {statusLabel(status)}
    </span>
  );
}

function ProductThumb({ src, alt }: { src: string | null; alt: string }) {
  if (!src) {
    return (
      <div className="flex h-12 w-10 shrink-0 items-center justify-center bg-sand text-[9px] text-muted">
        —
      </div>
    );
  }
  return (
    // Product images are remote blob URLs managed by admin uploads.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="h-12 w-10 shrink-0 object-cover"
    />
  );
}
