"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { adminFetch } from "@/lib/admin/client";
import { useAdminResource } from "@/lib/admin/useAdminResource";
import { formatINR } from "@/lib/format";

type Product = {
  id: string;
  name: string;
  slug: string;
  category: string;
  categorySlug: string;
  price: number;
  compareAt: number | null;
  active: boolean;
  isNew: boolean;
  onSale: boolean;
  featured: boolean;
  sizes: Record<string, number>;
};

const emptyForm = {
  name: "",
  slug: "",
  category: "Party & Western",
  categorySlug: "party-western",
  price: 2999,
  compareAt: "",
  colors: "Black",
  fabric: "Crepe",
  occasion: "Party",
  description: "New boutique piece from Thanishka.",
  care: "Dry clean recommended.",
  images:
    "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=1200&q=80, https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=1200&q=80",
  xs: 0,
  s: 2,
  m: 4,
  l: 3,
  xl: 1,
  xxl: 0,
  isNew: true,
  featured: false,
};

export default function AdminProductsPage() {
  const { data, error, setError, reload } = useAdminResource<{
    products: Product[];
  }>("/api/admin/products");
  const products = data?.products ?? [];
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      await adminFetch("/api/admin/products", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          slug: form.slug,
          category: form.category,
          categorySlug: form.categorySlug,
          price: Number(form.price),
          compareAt: form.compareAt ? Number(form.compareAt) : null,
          colors: form.colors.split(",").map((s) => s.trim()).filter(Boolean),
          fabric: form.fabric,
          occasion: form.occasion
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          description: form.description,
          care: form.care,
          images: form.images
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          sizes: {
            XS: Number(form.xs),
            S: Number(form.s),
            M: Number(form.m),
            L: Number(form.l),
            XL: Number(form.xl),
            XXL: Number(form.xxl),
          },
          isNew: form.isNew,
          featured: form.featured,
          onSale: Boolean(form.compareAt),
          active: true,
        }),
      });
      setMessage("Product created.");
      setForm(emptyForm);
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    }
  }

  async function toggleActive(product: Product) {
    setError("");
    try {
      await adminFetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        body: JSON.stringify({ active: !product.active }),
      });
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl tracking-[0.14em] md:text-3xl">
        Products
      </h1>
      <p className="mt-2 font-serif text-muted">
        Catalogue management — create styles and activate or archive them.
      </p>

      {error ? <p className="mt-4 text-sm text-sale">{error}</p> : null}
      {message ? <p className="mt-4 text-sm text-emerald">{message}</p> : null}

      <form
        onSubmit={onCreate}
        className="mt-8 grid gap-3 border border-line bg-ivory p-5 md:grid-cols-2"
      >
        <h2 className="font-display text-[11px] tracking-[0.16em] md:col-span-2">
          Add product
        </h2>
        {(
          [
            ["name", "Name"],
            ["slug", "Slug"],
            ["category", "Category"],
            ["categorySlug", "Category slug"],
            ["price", "Price"],
            ["compareAt", "Compare at"],
            ["colors", "Colors (comma)"],
            ["fabric", "Fabric"],
            ["occasion", "Occasion (comma)"],
            ["care", "Care"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="block text-sm">
            <span className="mb-1 block font-display text-[9px] tracking-[0.14em] text-muted">
              {label}
            </span>
            <input
              value={String(form[key])}
              onChange={(e) =>
                setForm((f) => ({ ...f, [key]: e.target.value }))
              }
              className="w-full border border-line px-3 py-2"
              required={key !== "compareAt"}
            />
          </label>
        ))}
        <label className="block text-sm md:col-span-2">
          <span className="mb-1 block font-display text-[9px] tracking-[0.14em] text-muted">
            Description
          </span>
          <textarea
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            className="w-full border border-line px-3 py-2"
            rows={3}
            required
          />
        </label>
        <label className="block text-sm md:col-span-2">
          <span className="mb-1 block font-display text-[9px] tracking-[0.14em] text-muted">
            Images (comma URLs, min 2)
          </span>
          <textarea
            value={form.images}
            onChange={(e) => setForm((f) => ({ ...f, images: e.target.value }))}
            className="w-full border border-line px-3 py-2"
            rows={2}
            required
          />
        </label>
        <div className="grid grid-cols-6 gap-2 md:col-span-2">
          {(
            [
              ["xs", "XS"],
              ["s", "S"],
              ["m", "M"],
              ["l", "L"],
              ["xl", "XL"],
              ["xxl", "XXL"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block text-sm">
              <span className="mb-1 block font-display text-[9px] tracking-[0.14em] text-muted">
                {label}
              </span>
              <input
                type="number"
                min={0}
                value={form[key]}
                onChange={(e) =>
                  setForm((f) => ({ ...f, [key]: Number(e.target.value) }))
                }
                className="w-full border border-line px-2 py-2"
              />
            </label>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isNew}
            onChange={(e) =>
              setForm((f) => ({ ...f, isNew: e.target.checked }))
            }
          />
          New In
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(e) =>
              setForm((f) => ({ ...f, featured: e.target.checked }))
            }
          />
          Featured
        </label>
        <div className="md:col-span-2">
          <Button type="submit">Create product</Button>
        </div>
      </form>

      <div className="mt-8 overflow-x-auto border border-line bg-ivory">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-line font-display text-[10px] tracking-[0.14em] text-muted">
            <tr>
              <th className="px-3 py-3">Name</th>
              <th className="px-3 py-3">Price</th>
              <th className="px-3 py-3">Flags</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-line/70">
                <td className="px-3 py-3">
                  <div>{p.name}</div>
                  <div className="text-xs text-muted">{p.slug}</div>
                </td>
                <td className="px-3 py-3">{formatINR(p.price)}</td>
                <td className="px-3 py-3 text-xs text-muted">
                  {[p.isNew && "new", p.onSale && "sale", p.featured && "featured"]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </td>
                <td className="px-3 py-3">
                  {p.active ? "Active" : "Archived"}
                </td>
                <td className="px-3 py-3">
                  <Button
                    type="button"
                    variant="secondary"
                    className="px-3 py-2"
                    onClick={() => toggleActive(p)}
                  >
                    {p.active ? "Archive" : "Activate"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
