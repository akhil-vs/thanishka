"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { adminFetch } from "@/lib/admin/client";
import { useAdminResource } from "@/lib/admin/useAdminResource";

type Offer = {
  id: string;
  title: string;
  eyebrow: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  active: boolean;
  sortOrder: number;
};

const empty = {
  title: "",
  eyebrow: "",
  subtitle: "",
  ctaLabel: "Shop now",
  ctaHref: "/shop",
  sortOrder: 0,
  active: true,
};

export default function AdminOffersPage() {
  const { data, error, setError, reload } = useAdminResource<{
    offers: Offer[];
  }>("/api/admin/offers");
  const rows = data?.offers ?? [];
  const [form, setForm] = useState(empty);
  const [message, setMessage] = useState("");

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      await adminFetch("/api/admin/offers", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setForm(empty);
      setMessage("Offer created.");
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    }
  }

  async function toggle(o: Offer) {
    await adminFetch(`/api/admin/offers/${o.id}`, {
      method: "PATCH",
      body: JSON.stringify({ active: !o.active }),
    });
    reload();
  }

  async function remove(id: string) {
    await adminFetch(`/api/admin/offers/${id}`, { method: "DELETE" });
    reload();
  }

  return (
    <div>
      <h1 className="font-display text-2xl tracking-[0.14em] md:text-3xl">
        Offers
      </h1>
      <p className="mt-2 font-serif text-muted">
        Promotional banners shown on the storefront home page.
      </p>

      {error ? <p className="mt-4 text-sm text-sale">{error}</p> : null}
      {message ? <p className="mt-4 text-sm text-emerald">{message}</p> : null}

      <form
        onSubmit={onCreate}
        className="mt-8 grid gap-3 border border-line bg-ivory p-5 md:grid-cols-2"
      >
        <h2 className="font-display text-[11px] tracking-[0.16em] md:col-span-2">
          New offer
        </h2>
        <input
          required
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          className="border border-line px-3 py-2 md:col-span-2"
        />
        <input
          placeholder="Eyebrow"
          value={form.eyebrow}
          onChange={(e) => setForm((f) => ({ ...f, eyebrow: e.target.value }))}
          className="border border-line px-3 py-2"
        />
        <input
          type="number"
          placeholder="Sort order"
          value={form.sortOrder}
          onChange={(e) =>
            setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))
          }
          className="border border-line px-3 py-2"
        />
        <textarea
          required
          placeholder="Subtitle"
          value={form.subtitle}
          onChange={(e) =>
            setForm((f) => ({ ...f, subtitle: e.target.value }))
          }
          className="border border-line px-3 py-2 md:col-span-2"
          rows={3}
        />
        <input
          required
          placeholder="CTA label"
          value={form.ctaLabel}
          onChange={(e) =>
            setForm((f) => ({ ...f, ctaLabel: e.target.value }))
          }
          className="border border-line px-3 py-2"
        />
        <input
          required
          placeholder="CTA href"
          value={form.ctaHref}
          onChange={(e) => setForm((f) => ({ ...f, ctaHref: e.target.value }))}
          className="border border-line px-3 py-2"
        />
        <div className="md:col-span-2">
          <Button type="submit">Create offer</Button>
        </div>
      </form>

      <div className="mt-8 space-y-3">
        {rows.map((o) => (
          <div
            key={o.id}
            className="flex flex-wrap items-center justify-between gap-3 border border-line bg-ivory p-4"
          >
            <div>
              <p className="font-display text-[10px] tracking-[0.16em] text-kasavu-deep">
                {o.eyebrow || "Offer"}
              </p>
              <p className="mt-1 font-display text-[12px] tracking-[0.12em]">
                {o.title}
              </p>
              <p className="mt-1 max-w-xl font-serif text-sm text-muted">
                {o.subtitle}
              </p>
              <p className="mt-2 text-xs text-muted">
                {o.ctaLabel} → {o.ctaHref} · sort {o.sortOrder} ·{" "}
                {o.active ? "active" : "off"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                className="px-3 py-2"
                onClick={() => toggle(o).catch((err) => setError(err.message))}
              >
                {o.active ? "Disable" : "Enable"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="px-3 py-2 text-sale"
                onClick={() => remove(o.id).catch((err) => setError(err.message))}
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
