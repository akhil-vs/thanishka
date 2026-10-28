"use client";

import { FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { adminFetch } from "@/lib/admin/client";
import { SIZE_KEYS, type SizeKey } from "@/lib/admin/stock";
import { useAdminResource } from "@/lib/admin/useAdminResource";

type StockRow = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
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
};

type BulkLine = {
  productId: string;
  size: SizeKey;
  delta: number;
};

export default function AdminStockPage() {
  const { data, error, setError, reload } =
    useAdminResource<StockResponse>("/api/admin/stock");
  const [message, setMessage] = useState("");
  const [single, setSingle] = useState({
    productId: "",
    size: "M" as SizeKey,
    mode: "adjust" as "adjust" | "set",
    value: 1,
    note: "",
  });
  const [bulkText, setBulkText] = useState(
    "# productId,size,delta\n# example: 1,M,5",
  );
  const [bulkNote, setBulkNote] = useState("Bulk intake");

  const selectedProductId = single.productId || data?.stock[0]?.id || "";

  const nameById = useMemo(() => {
    const map = new Map<string, string>();
    data?.stock.forEach((s) => map.set(s.id, s.name));
    return map;
  }, [data]);

  async function submitSingle(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
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
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
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
    }
  }

  if (!data && !error) {
    return <p className="font-serif text-muted">Loading stock…</p>;
  }

  return (
    <div>
      <h1 className="font-display text-2xl tracking-[0.14em] md:text-3xl">
        Manage stock
      </h1>
      <p className="mt-2 font-serif text-muted">
        Single size updates or bulk CSV-style intake for warehouse entry.
      </p>

      {error ? <p className="mt-4 text-sm text-sale">{error}</p> : null}
      {message ? <p className="mt-4 text-sm text-emerald">{message}</p> : null}

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <form
          onSubmit={submitSingle}
          className="space-y-3 border border-line bg-ivory p-5"
        >
          <h2 className="font-display text-[11px] tracking-[0.16em]">
            Single entry
          </h2>
          <select
            value={selectedProductId}
            onChange={(e) =>
              setSingle((s) => ({ ...s, productId: e.target.value }))
            }
            className="w-full border border-line bg-transparent px-3 py-2 text-sm"
          >
            {data?.stock.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-3 gap-2">
            <select
              value={single.size}
              onChange={(e) =>
                setSingle((s) => ({
                  ...s,
                  size: e.target.value as SizeKey,
                }))
              }
              className="border border-line bg-transparent px-3 py-2 text-sm"
            >
              {SIZE_KEYS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <select
              value={single.mode}
              onChange={(e) =>
                setSingle((s) => ({
                  ...s,
                  mode: e.target.value as "adjust" | "set",
                }))
              }
              className="border border-line bg-transparent px-3 py-2 text-sm"
            >
              <option value="adjust">Adjust ±</option>
              <option value="set">Set exact</option>
            </select>
            <input
              type="number"
              value={single.value}
              onChange={(e) =>
                setSingle((s) => ({ ...s, value: Number(e.target.value) }))
              }
              className="border border-line bg-transparent px-3 py-2 text-sm"
            />
          </div>
          <input
            value={single.note}
            onChange={(e) =>
              setSingle((s) => ({ ...s, note: e.target.value }))
            }
            placeholder="Note (optional)"
            className="w-full border border-line bg-transparent px-3 py-2 text-sm"
          />
          <Button type="submit">Save stock</Button>
        </form>

        <form
          onSubmit={submitBulk}
          className="space-y-3 border border-line bg-ivory p-5"
        >
          <h2 className="font-display text-[11px] tracking-[0.16em]">
            Bulk entry
          </h2>
          <p className="font-serif text-sm text-muted">
            One row per size: <code>productId,size,delta</code>
          </p>
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            rows={8}
            className="w-full border border-line bg-transparent px-3 py-2 font-mono text-xs"
          />
          <input
            value={bulkNote}
            onChange={(e) => setBulkNote(e.target.value)}
            className="w-full border border-line bg-transparent px-3 py-2 text-sm"
          />
          <Button type="submit" variant="gold">
            Apply bulk
          </Button>
        </form>
      </div>

      <div className="mt-8 overflow-x-auto border border-line bg-ivory">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-line font-display text-[10px] tracking-[0.14em] text-muted">
            <tr>
              <th className="px-3 py-3">Product</th>
              {SIZE_KEYS.map((size) => (
                <th key={size} className="px-2 py-3">
                  {size}
                </th>
              ))}
              <th className="px-3 py-3">Total</th>
            </tr>
          </thead>
          <tbody>
            {data?.stock.map((row) => (
              <tr key={row.id} className="border-b border-line/70">
                <td className="px-3 py-3">
                  <div className="font-medium">{row.name}</div>
                  <div className="text-xs text-muted">id: {row.id}</div>
                </td>
                {SIZE_KEYS.map((size) => (
                  <td key={size} className="px-2 py-3">
                    {row.sizes[size] ?? 0}
                  </td>
                ))}
                <td className="px-3 py-3 font-display text-[11px] tracking-[0.12em]">
                  {row.total}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="mt-8 border border-line bg-ivory p-5">
        <h2 className="font-display text-[11px] tracking-[0.16em]">
          Movement log
        </h2>
        <ul className="mt-4 space-y-2 text-sm">
          {data?.movements.map((m) => (
            <li
              key={m.id}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2"
            >
              <span>
                {nameById.get(m.productId) ?? m.productId} · {m.size} ·{" "}
                {m.source}
              </span>
              <span>
                {m.delta >= 0 ? "+" : ""}
                {m.delta} → {m.quantityAfter}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
