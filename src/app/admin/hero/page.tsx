"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { adminFetch } from "@/lib/admin/client";
import { useAdminResource } from "@/lib/admin/useAdminResource";

type Slide = {
  id: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  imageUrl: string;
  active: boolean;
  sortOrder: number;
};

const empty = {
  title: "",
  subtitle: "",
  ctaLabel: "Shop",
  ctaHref: "/shop",
  imageUrl:
    "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=2000&q=80",
  sortOrder: 0,
  active: true,
};

export default function AdminHeroPage() {
  const { data, error, setError, reload } = useAdminResource<{
    slides: Slide[];
  }>("/api/admin/hero");
  const rows = data?.slides ?? [];
  const [form, setForm] = useState(empty);
  const [message, setMessage] = useState("");

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      await adminFetch("/api/admin/hero", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setForm(empty);
      setMessage("Hero slide created.");
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    }
  }

  async function toggle(s: Slide) {
    await adminFetch(`/api/admin/hero/${s.id}`, {
      method: "PATCH",
      body: JSON.stringify({ active: !s.active }),
    });
    reload();
  }

  async function remove(id: string) {
    await adminFetch(`/api/admin/hero/${id}`, { method: "DELETE" });
    reload();
  }

  return (
    <div>
      <h1 className="font-display text-2xl tracking-[0.14em] md:text-3xl">
        Hero images
      </h1>
      <p className="mt-2 font-serif text-muted">
        Homepage slider slides — image, copy, and CTA.
      </p>

      {error ? <p className="mt-4 text-sm text-sale">{error}</p> : null}
      {message ? <p className="mt-4 text-sm text-emerald">{message}</p> : null}

      <form
        onSubmit={onCreate}
        className="mt-8 grid gap-3 border border-line bg-ivory p-5 md:grid-cols-2"
      >
        <h2 className="font-display text-[11px] tracking-[0.16em] md:col-span-2">
          New slide
        </h2>
        <input
          required
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
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
        <input
          required
          placeholder="Image URL"
          value={form.imageUrl}
          onChange={(e) =>
            setForm((f) => ({ ...f, imageUrl: e.target.value }))
          }
          className="border border-line px-3 py-2 md:col-span-2"
        />
        <div className="md:col-span-2">
          <Button type="submit">Create slide</Button>
        </div>
      </form>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {rows.map((s) => (
          <div key={s.id} className="overflow-hidden border border-line bg-ivory">
            <div className="relative h-40 bg-sand">
              <Image
                src={s.imageUrl}
                alt={s.title}
                fill
                className="object-cover"
                sizes="(max-width:768px) 100vw, 50vw"
              />
            </div>
            <div className="p-4">
              <p className="font-display text-[12px] tracking-[0.14em]">
                {s.title}
              </p>
              <p className="mt-2 font-serif text-sm text-muted">{s.subtitle}</p>
              <p className="mt-2 text-xs text-muted">
                {s.ctaLabel} → {s.ctaHref} · sort {s.sortOrder} ·{" "}
                {s.active ? "active" : "off"}
              </p>
              <div className="mt-4 flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="px-3 py-2"
                  onClick={() =>
                    toggle(s).catch((err) => setError(err.message))
                  }
                >
                  {s.active ? "Disable" : "Enable"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="px-3 py-2 text-sale"
                  onClick={() =>
                    remove(s.id).catch((err) => setError(err.message))
                  }
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
