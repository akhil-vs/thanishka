"use client";

import { FormEvent, useState } from "react";
import { ImageUploader } from "@/components/admin/ImageUploader";
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
  colors: string[];
  fabric: string;
  occasion: string[];
  description: string;
  care: string;
  images: string[];
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
  price: "2999",
  compareAt: "",
  colors: "Black",
  fabric: "Crepe",
  occasion: "Party",
  description: "New boutique piece from Thanishka.",
  care: "Dry clean recommended.",
  images: [] as string[],
  xs: 0,
  s: 2,
  m: 4,
  l: 3,
  xl: 1,
  xxl: 0,
  isNew: true,
  featured: false,
};

type FormState = typeof emptyForm;

type PricingDraft = {
  productId: string;
  name: string;
  price: string;
  compareAt: string;
};

function parseRupees(value: string): number | null {
  const trimmed = value.trim().replace(/,/g, "");
  if (!trimmed) return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) return null;
  return n;
}

function pricingError(priceRaw: string, compareAtRaw: string): string | null {
  const price = parseRupees(priceRaw);
  if (price == null) return "Enter a valid selling price in whole rupees.";
  const compareAt = compareAtRaw.trim()
    ? parseRupees(compareAtRaw)
    : null;
  if (compareAtRaw.trim() && compareAt == null) {
    return "Enter a valid MRP in whole rupees, or leave it blank.";
  }
  if (compareAt != null && compareAt <= price) {
    return "MRP / original price must be higher than the selling price.";
  }
  return null;
}

function productToForm(p: Product): FormState {
  return {
    name: p.name,
    slug: p.slug,
    category: p.category,
    categorySlug: p.categorySlug,
    price: String(p.price),
    compareAt: p.compareAt != null ? String(p.compareAt) : "",
    colors: p.colors.join(", "),
    fabric: p.fabric,
    occasion: p.occasion.join(", "),
    description: p.description,
    care: p.care,
    images: [...p.images],
    xs: p.sizes.XS ?? 0,
    s: p.sizes.S ?? 0,
    m: p.sizes.M ?? 0,
    l: p.sizes.L ?? 0,
    xl: p.sizes.XL ?? 0,
    xxl: p.sizes.XXL ?? 0,
    isNew: p.isNew,
    featured: p.featured,
  };
}

function formPayload(form: FormState, includeSizes: boolean) {
  const price = parseRupees(form.price);
  const compareAt = form.compareAt.trim()
    ? parseRupees(form.compareAt)
    : null;
  const base = {
    name: form.name,
    slug: form.slug,
    category: form.category,
    categorySlug: form.categorySlug,
    price: price ?? 0,
    compareAt,
    colors: form.colors.split(",").map((s) => s.trim()).filter(Boolean),
    fabric: form.fabric,
    occasion: form.occasion
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    description: form.description,
    care: form.care,
    images: form.images,
    isNew: form.isNew,
    featured: form.featured,
    onSale: Boolean(compareAt != null && price != null && compareAt > price),
  };
  if (!includeSizes) return base;
  return {
    ...base,
    sizes: {
      XS: Number(form.xs),
      S: Number(form.s),
      M: Number(form.m),
      L: Number(form.l),
      XL: Number(form.xl),
      XXL: Number(form.xxl),
    },
  };
}

function PricingFields({
  price,
  compareAt,
  onPriceChange,
  onCompareAtChange,
  idPrefix,
}: {
  price: string;
  compareAt: string;
  onPriceChange: (value: string) => void;
  onCompareAtChange: (value: string) => void;
  idPrefix: string;
}) {
  const parsedPrice = parseRupees(price);
  const parsedCompare = compareAt.trim() ? parseRupees(compareAt) : null;
  const onSale =
    parsedPrice != null &&
    parsedCompare != null &&
    parsedCompare > parsedPrice;

  return (
    <div className="grid gap-3 border border-line bg-sand/20 p-4 md:col-span-2 md:grid-cols-2">
      <div className="md:col-span-2">
        <h3 className="font-display text-[11px] tracking-[0.16em]">
          Pricing
        </h3>
        <p className="mt-1 font-serif text-sm text-muted">
          Selling price is what customers pay. Add an MRP only when you want a
          strikethrough discount on the storefront.
        </p>
      </div>
      <label className="block text-sm" htmlFor={`${idPrefix}-price`}>
        <span className="mb-1 block font-display text-[9px] tracking-[0.14em] text-muted">
          Selling price (₹)
        </span>
        <input
          id={`${idPrefix}-price`}
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          value={price}
          onChange={(e) => onPriceChange(e.target.value)}
          className="w-full border border-line bg-ivory px-3 py-2"
          required
        />
      </label>
      <label className="block text-sm" htmlFor={`${idPrefix}-mrp`}>
        <span className="mb-1 block font-display text-[9px] tracking-[0.14em] text-muted">
          MRP / original (₹) — optional
        </span>
        <input
          id={`${idPrefix}-mrp`}
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          value={compareAt}
          onChange={(e) => onCompareAtChange(e.target.value)}
          className="w-full border border-line bg-ivory px-3 py-2"
          placeholder="Leave blank for no discount"
        />
      </label>
      <div className="font-serif text-sm text-muted md:col-span-2">
        {onSale && parsedPrice != null && parsedCompare != null ? (
          <p>
            Storefront preview:{" "}
            <span className="text-charcoal">{formatINR(parsedPrice)}</span>{" "}
            <span className="line-through">{formatINR(parsedCompare)}</span>
            <span className="ml-2 font-display text-[9px] tracking-[0.14em] text-sale">
              ON SALE
            </span>
          </p>
        ) : parsedPrice != null ? (
          <p>
            Storefront preview:{" "}
            <span className="text-charcoal">{formatINR(parsedPrice)}</span>
            <span className="ml-2 text-muted">· no discount</span>
          </p>
        ) : (
          <p>Enter a selling price to preview.</p>
        )}
      </div>
    </div>
  );
}

export default function AdminProductsPage() {
  const { data, error, setError, reload } = useAdminResource<{
    products: Product[];
  }>("/api/admin/products");
  const products = data?.products ?? [];
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pricingDraft, setPricingDraft] = useState<PricingDraft | null>(null);
  const [pricingBusy, setPricingBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    const priceIssue = pricingError(form.price, form.compareAt);
    if (priceIssue) {
      setError(priceIssue);
      return;
    }
    if (form.images.length < 2) {
      setError("Upload at least 2 product images.");
      return;
    }
    try {
      if (editingId) {
        await adminFetch(`/api/admin/products/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(formPayload(form, false)),
        });
        setMessage("Product updated.");
      } else {
        await adminFetch("/api/admin/products", {
          method: "POST",
          body: JSON.stringify({
            ...formPayload(form, true),
            active: true,
          }),
        });
        setMessage("Product created.");
      }
      setForm(emptyForm);
      setEditingId(null);
      setPricingDraft(null);
      reload();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : editingId
            ? "Update failed"
            : "Create failed",
      );
    }
  }

  function startEdit(product: Product) {
    setEditingId(product.id);
    setForm(productToForm(product));
    setPricingDraft(null);
    setMessage("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setMessage("");
    setError("");
  }

  function openPricing(product: Product) {
    setPricingDraft({
      productId: product.id,
      name: product.name,
      price: String(product.price),
      compareAt: product.compareAt != null ? String(product.compareAt) : "",
    });
    setMessage("");
    setError("");
  }

  async function savePricing(e: FormEvent) {
    e.preventDefault();
    if (!pricingDraft) return;
    setError("");
    setMessage("");
    const issue = pricingError(pricingDraft.price, pricingDraft.compareAt);
    if (issue) {
      setError(issue);
      return;
    }
    const price = parseRupees(pricingDraft.price)!;
    const compareAt = pricingDraft.compareAt.trim()
      ? parseRupees(pricingDraft.compareAt)
      : null;
    setPricingBusy(true);
    try {
      await adminFetch(`/api/admin/products/${pricingDraft.productId}`, {
        method: "PATCH",
        body: JSON.stringify({
          price,
          compareAt,
          onSale: Boolean(compareAt != null && compareAt > price),
        }),
      });
      setMessage(`Price updated for ${pricingDraft.name}.`);
      setPricingDraft(null);
      if (editingId === pricingDraft.productId) {
        setForm((f) => ({
          ...f,
          price: String(price),
          compareAt: compareAt != null ? String(compareAt) : "",
        }));
      }
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Price update failed");
    } finally {
      setPricingBusy(false);
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
        Catalogue management — create, edit, set selling price or MRP discount,
        and archive styles. Use Stock to adjust size quantities after create.
      </p>

      {error ? <p className="mt-4 text-sm text-sale">{error}</p> : null}
      {message ? <p className="mt-4 text-sm text-emerald">{message}</p> : null}

      {pricingDraft ? (
        <form
          onSubmit={savePricing}
          className="mt-8 grid gap-3 border border-line bg-ivory p-5 md:grid-cols-2"
        >
          <h2 className="font-display text-[11px] tracking-[0.16em] md:col-span-2">
            Set price — {pricingDraft.name}
          </h2>
          <PricingFields
            idPrefix="quick"
            price={pricingDraft.price}
            compareAt={pricingDraft.compareAt}
            onPriceChange={(price) =>
              setPricingDraft((d) => (d ? { ...d, price } : d))
            }
            onCompareAtChange={(compareAt) =>
              setPricingDraft((d) => (d ? { ...d, compareAt } : d))
            }
          />
          <div className="flex flex-wrap gap-2 md:col-span-2">
            <Button type="submit" disabled={pricingBusy}>
              {pricingBusy ? "Saving…" : "Save price"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={pricingBusy}
              onClick={() => setPricingDraft(null)}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      <form
        onSubmit={onSubmit}
        className="mt-8 grid gap-3 border border-line bg-ivory p-5 md:grid-cols-2"
      >
        <h2 className="font-display text-[11px] tracking-[0.16em] md:col-span-2">
          {editingId ? "Edit product" : "Add product"}
        </h2>
        {(
          [
            ["name", "Name"],
            ["slug", "Slug"],
            ["category", "Category"],
            ["categorySlug", "Category slug"],
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
              required
            />
          </label>
        ))}
        <PricingFields
          idPrefix="form"
          price={form.price}
          compareAt={form.compareAt}
          onPriceChange={(price) => setForm((f) => ({ ...f, price }))}
          onCompareAtChange={(compareAt) =>
            setForm((f) => ({ ...f, compareAt }))
          }
        />
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
        <ImageUploader
          label="Product images"
          hint="Upload at least 2 photos. JPEG, PNG, WebP or GIF · max 4 MB each."
          values={form.images}
          onChange={(images) => setForm((f) => ({ ...f, images }))}
          maxFiles={8}
        />
        {!editingId ? (
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
        ) : (
          <p className="font-serif text-sm text-muted md:col-span-2">
            Size quantities are managed on the Stock page so edits do not
            overwrite live inventory.
          </p>
        )}
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
        <div className="flex flex-wrap gap-2 md:col-span-2">
          <Button type="submit">
            {editingId ? "Save changes" : "Create product"}
          </Button>
          {editingId ? (
            <Button type="button" variant="secondary" onClick={cancelEdit}>
              Cancel
            </Button>
          ) : null}
        </div>
      </form>

      <div className="mt-8 overflow-x-auto border border-line bg-ivory">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-line font-display text-[10px] tracking-[0.14em] text-muted">
            <tr>
              <th className="px-3 py-3">Name</th>
              <th className="px-3 py-3">Selling</th>
              <th className="px-3 py-3">MRP</th>
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
                <td className="px-3 py-3 text-muted">
                  {p.compareAt ? (
                    <span className="line-through">{formatINR(p.compareAt)}</span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-3 py-3 text-xs text-muted">
                  {[p.isNew && "new", p.onSale && "sale", p.featured && "featured"]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </td>
                <td className="px-3 py-3">
                  {p.active ? "Active" : "Archived"}
                </td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      className="px-3 py-2"
                      onClick={() => openPricing(p)}
                    >
                      Set price
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="px-3 py-2"
                      onClick={() => startEdit(p)}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="px-3 py-2"
                      onClick={() => toggleActive(p)}
                    >
                      {p.active ? "Archive" : "Activate"}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
