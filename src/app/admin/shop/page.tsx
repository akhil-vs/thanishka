"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { adminFetch } from "@/lib/admin/client";
import { useAdminResource } from "@/lib/admin/useAdminResource";

type ShopResponse = {
  shop: {
    id: string;
    slug: string;
    name: string;
    phone: string | null;
    whatsapp: string | null;
    gstin: string | null;
    active: boolean;
    updatedAt: string;
  };
};

function ShopForm({
  shop,
  onSaved,
}: {
  shop: ShopResponse["shop"];
  onSaved: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setFormError("");
    setMessage("");
    const form = new FormData(e.currentTarget);
    try {
      await adminFetch("/api/admin/shop", {
        method: "PATCH",
        body: JSON.stringify({
          name: String(form.get("name") ?? ""),
          phone: String(form.get("phone") ?? "") || null,
          whatsapp: String(form.get("whatsapp") ?? "") || null,
          gstin: String(form.get("gstin") ?? "") || null,
          active: form.get("active") === "on",
        }),
      });
      setMessage("Boutique settings saved.");
      onSaved();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-8 max-w-xl space-y-3 border border-charcoal/15 bg-ivory p-5"
    >
      <p className="font-display text-[10px] tracking-[0.14em] text-muted">
        Slug · /{shop.slug}
      </p>
      <input
        name="name"
        defaultValue={shop.name}
        required
        placeholder="Boutique name"
        className="w-full border border-line px-3 py-2.5 text-sm outline-none focus:border-kasavu"
      />
      <input
        name="phone"
        defaultValue={shop.phone ?? ""}
        placeholder="Phone"
        className="w-full border border-line px-3 py-2.5 text-sm outline-none focus:border-kasavu"
      />
      <input
        name="whatsapp"
        defaultValue={shop.whatsapp ?? ""}
        placeholder="WhatsApp"
        className="w-full border border-line px-3 py-2.5 text-sm outline-none focus:border-kasavu"
      />
      <input
        name="gstin"
        defaultValue={shop.gstin ?? ""}
        placeholder="GSTIN"
        className="w-full border border-line px-3 py-2.5 text-sm outline-none focus:border-kasavu"
      />
      <label className="flex items-center gap-2 font-serif text-sm text-muted">
        <input name="active" type="checkbox" defaultChecked={shop.active} />
        Boutique is live
      </label>
      {formError ? <p className="text-sm text-sale">{formError}</p> : null}
      {message ? <p className="text-sm text-emerald">{message}</p> : null}
      <Button type="submit" disabled={busy}>
        {busy ? "Saving…" : "Save boutique"}
      </Button>
    </form>
  );
}

export default function AdminShopPage() {
  const { data, error, reload } = useAdminResource<ShopResponse>("/api/admin/shop");

  if (error) return <p className="text-sale">{error}</p>;
  if (!data) return <p className="font-serif text-muted">Loading boutique…</p>;

  return (
    <div>
      <p className="font-display text-[10px] tracking-[0.2em] text-kasavu-deep">
        Platform control
      </p>
      <h1 className="mt-2 font-display text-2xl tracking-[0.14em] md:text-3xl">
        Boutique
      </h1>
      <p className="mt-2 max-w-xl font-serif text-muted">
        Shop identity and contact details. Catalogue work stays in Studio.
      </p>
      <ShopForm
        key={data.shop.updatedAt}
        shop={data.shop}
        onSaved={reload}
      />
    </div>
  );
}
