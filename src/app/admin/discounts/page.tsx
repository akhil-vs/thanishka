"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { adminFetch } from "@/lib/admin/client";
import { useAdminResource } from "@/lib/admin/useAdminResource";

type Discount = {
  id: string;
  code: string;
  label: string;
  type: "percent" | "fixed";
  value: number;
  minOrder: number;
  maxUses: number | null;
  usedCount: number;
  active: boolean;
  startsAt: string | null;
  endsAt: string | null;
};

const empty: {
  code: string;
  label: string;
  type: "percent" | "fixed";
  value: number;
  minOrder: number;
  maxUses: string;
  active: boolean;
} = {
  code: "",
  label: "",
  type: "percent",
  value: 10,
  minOrder: 0,
  maxUses: "",
  active: true,
};

export default function AdminDiscountsPage() {
  const { data, error, setError, reload } = useAdminResource<{
    discounts: Discount[];
  }>("/api/admin/discounts");
  const rows = data?.discounts ?? [];
  const [form, setForm] = useState(empty);
  const [message, setMessage] = useState("");

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      await adminFetch("/api/admin/discounts", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          maxUses: form.maxUses === "" ? null : Number(form.maxUses),
        }),
      });
      setForm(empty);
      setMessage("Discount created.");
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    }
  }

  async function toggle(d: Discount) {
    await adminFetch(`/api/admin/discounts/${d.id}`, {
      method: "PATCH",
      body: JSON.stringify({ active: !d.active }),
    });
    reload();
  }

  async function remove(id: string) {
    await adminFetch(`/api/admin/discounts/${id}`, { method: "DELETE" });
    reload();
  }

  return (
    <div>
      <h1 className="font-display text-2xl tracking-[0.14em] md:text-3xl">
        Discounts
      </h1>
      <p className="mt-2 font-serif text-muted">
        Coupon codes for checkout — percent or fixed amount.
      </p>

      {error ? <p className="mt-4 text-sm text-sale">{error}</p> : null}
      {message ? <p className="mt-4 text-sm text-emerald">{message}</p> : null}

      <form
        onSubmit={onCreate}
        className="mt-8 grid gap-3 border border-line bg-ivory p-5 md:grid-cols-2"
      >
        <h2 className="font-display text-[11px] tracking-[0.16em] md:col-span-2">
          New discount
        </h2>
        <input
          required
          placeholder="Code"
          value={form.code}
          onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
          className="border border-line px-3 py-2"
        />
        <input
          required
          placeholder="Label"
          value={form.label}
          onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
          className="border border-line px-3 py-2"
        />
        <select
          value={form.type}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              type: e.target.value as "percent" | "fixed",
            }))
          }
          className="border border-line px-3 py-2"
        >
          <option value="percent">Percent</option>
          <option value="fixed">Fixed ₹</option>
        </select>
        <input
          type="number"
          required
          min={1}
          value={form.value}
          onChange={(e) =>
            setForm((f) => ({ ...f, value: Number(e.target.value) }))
          }
          className="border border-line px-3 py-2"
        />
        <input
          type="number"
          min={0}
          placeholder="Min order"
          value={form.minOrder}
          onChange={(e) =>
            setForm((f) => ({ ...f, minOrder: Number(e.target.value) }))
          }
          className="border border-line px-3 py-2"
        />
        <input
          type="number"
          min={1}
          placeholder="Max uses (optional)"
          value={form.maxUses}
          onChange={(e) =>
            setForm((f) => ({ ...f, maxUses: e.target.value }))
          }
          className="border border-line px-3 py-2"
        />
        <div className="md:col-span-2">
          <Button type="submit">Create discount</Button>
        </div>
      </form>

      <div className="mt-8 space-y-3">
        {rows.map((d) => (
          <div
            key={d.id}
            className="flex flex-wrap items-center justify-between gap-3 border border-line bg-ivory p-4"
          >
            <div>
              <p className="font-display text-[11px] tracking-[0.16em]">
                {d.code}
              </p>
              <p className="mt-1 font-serif text-sm text-muted">
                {d.label} · {d.type === "percent" ? `${d.value}%` : `₹${d.value}`}{" "}
                · used {d.usedCount}
                {d.maxUses ? `/${d.maxUses}` : ""} ·{" "}
                {d.active ? "active" : "off"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                className="px-3 py-2"
                onClick={() => toggle(d).catch((err) => setError(err.message))}
              >
                {d.active ? "Disable" : "Enable"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="px-3 py-2 text-sale"
                onClick={() => remove(d.id).catch((err) => setError(err.message))}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
