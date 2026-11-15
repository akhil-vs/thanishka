"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { adminFetch } from "@/lib/admin/client";
import { useAdminResource } from "@/lib/admin/useAdminResource";

type Announcement = {
  id: string;
  message: string;
  active: boolean;
  sortOrder: number;
};

const empty = {
  message: "",
  sortOrder: 0,
  active: true,
};

export default function AdminAnnouncementsPage() {
  const { data, error, setError, reload } = useAdminResource<{
    announcements: Announcement[];
  }>("/api/admin/announcements");
  const rows = data?.announcements ?? [];
  const [form, setForm] = useState(empty);
  const [message, setMessage] = useState("");

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      await adminFetch("/api/admin/announcements", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setForm(empty);
      setMessage("Scroll message created.");
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    }
  }

  async function toggle(row: Announcement) {
    await adminFetch(`/api/admin/announcements/${row.id}`, {
      method: "PATCH",
      body: JSON.stringify({ active: !row.active }),
    });
    reload();
  }

  async function remove(id: string) {
    await adminFetch(`/api/admin/announcements/${id}`, { method: "DELETE" });
    reload();
  }

  return (
    <div>
      <h1 className="font-display text-2xl tracking-[0.14em] md:text-3xl">
        Top scroll
      </h1>
      <p className="mt-2 font-serif text-muted">
        Messages that scroll across the storefront announcement bar.
      </p>

      {error ? <p className="mt-4 text-sm text-sale">{error}</p> : null}
      {message ? <p className="mt-4 text-sm text-emerald">{message}</p> : null}

      <form
        onSubmit={onCreate}
        className="mt-8 grid gap-3 border border-line bg-ivory p-5 md:grid-cols-2"
      >
        <h2 className="font-display text-[11px] tracking-[0.16em] md:col-span-2">
          New message
        </h2>
        <input
          required
          placeholder="Scroll message"
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          className="border border-line px-3 py-2 md:col-span-2"
          maxLength={200}
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
        <div className="md:col-span-2">
          <Button type="submit">Add message</Button>
        </div>
      </form>

      <ul className="mt-8 space-y-3">
        {rows.length === 0 ? (
          <li className="border border-line bg-ivory p-5 font-serif text-sm text-muted">
            No scroll messages yet. Add one above — inactive lists stay empty on
            the storefront until you enable them.
          </li>
        ) : (
          rows.map((row) => (
            <li
              key={row.id}
              className="flex flex-col gap-3 border border-line bg-ivory p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-serif text-sm">{row.message}</p>
                <p className="mt-1 font-display text-[10px] tracking-[0.14em] text-muted">
                  sort {row.sortOrder} · {row.active ? "active" : "off"}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="px-3 py-2"
                  onClick={() =>
                    toggle(row).catch((err) => setError(err.message))
                  }
                >
                  {row.active ? "Disable" : "Enable"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="px-3 py-2 text-sale"
                  onClick={() =>
                    remove(row.id).catch((err) => setError(err.message))
                  }
                >
                  Delete
                </Button>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
