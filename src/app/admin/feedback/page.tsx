"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { adminFetch } from "@/lib/admin/client";
import { useAdminResource } from "@/lib/admin/useAdminResource";
import type {
  FeedbackStatusValue,
  SerializedFeedback,
} from "@/lib/feedback/types";

const STATUS_FILTERS = [
  "ALL",
  "NEW",
  "REVIEWED",
  "PUBLISHED",
  "HIDDEN",
] as const;

const ACTIONS: Record<
  string,
  Array<"REVIEWED" | "PUBLISHED" | "HIDDEN" | "NEW">
> = {
  NEW: ["REVIEWED", "PUBLISHED", "HIDDEN"],
  REVIEWED: ["PUBLISHED", "HIDDEN", "NEW"],
  PUBLISHED: ["HIDDEN", "REVIEWED"],
  HIDDEN: ["REVIEWED", "PUBLISHED"],
};

export default function AdminFeedbackPage() {
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>("ALL");
  const path = useMemo(
    () =>
      status === "ALL"
        ? "/api/admin/feedback?limit=60"
        : `/api/admin/feedback?limit=60&status=${status}`,
    [status],
  );
  const { data, error, setError, reload } = useAdminResource<{
    feedback: SerializedFeedback[];
    counts: Record<string, number>;
  }>(path);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const rows = data?.feedback ?? [];
  const counts = data?.counts ?? {};

  async function setStatusFor(
    id: string,
    next: FeedbackStatusValue,
  ) {
    setBusyId(id);
    setError("");
    setMessage("");
    try {
      await adminFetch(`/api/admin/feedback/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });
      setMessage(`Marked ${next}`);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <h2 className="font-display text-2xl tracking-[0.14em]">Feedback</h2>
      <p className="mt-2 font-serif text-sm text-muted">
        Order-linked notes from delivered customers. Publish a quote to the
        homepage “From Trivandrum” section.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={`border px-3 py-1.5 font-display text-[9px] tracking-[0.14em] ${
              status === s
                ? "border-charcoal bg-charcoal text-ivory"
                : "border-line bg-ivory"
            }`}
          >
            {s === "ALL" ? "All" : s}
            {s !== "ALL" && counts[s] != null ? ` (${counts[s]})` : ""}
          </button>
        ))}
      </div>

      {error ? <p className="mt-4 text-sm text-sale">{error}</p> : null}
      {message ? <p className="mt-4 text-sm text-emerald">{message}</p> : null}

      <div className="mt-6 space-y-4">
        {rows.length === 0 ? (
          <p className="border border-line bg-ivory p-6 font-serif text-sm text-muted">
            No feedback in this view yet.
          </p>
        ) : (
          rows.map((row) => {
            const actions = ACTIONS[row.status] ?? [];
            return (
              <article
                key={row.id}
                className="border border-line bg-ivory p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-[11px] tracking-[0.16em]">
                      {row.orderNumber ?? row.orderId} · {row.rating}/5
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {row.status} · {row.displayName}
                      {row.place ? ` · ${row.place}` : ""} ·{" "}
                      {new Date(row.createdAt).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                </div>
                <p className="mt-4 font-serif text-lg leading-relaxed">
                  “{row.message}”
                </p>
                {actions.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {actions.map((next) => (
                      <Button
                        key={next}
                        type="button"
                        variant="secondary"
                        disabled={busyId === row.id}
                        onClick={() => setStatusFor(row.id, next)}
                      >
                        {next === "PUBLISHED"
                          ? "Publish"
                          : next === "HIDDEN"
                            ? "Hide"
                            : next === "REVIEWED"
                              ? "Mark reviewed"
                              : "Reopen"}
                      </Button>
                    ))}
                  </div>
                ) : null}
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
