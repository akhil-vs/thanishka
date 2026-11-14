"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { authFetch } from "@/lib/auth/client";
import type { SerializedFeedback } from "@/lib/feedback/types";
import { cn } from "@/lib/format";

type FeedbackState = {
  eligible: boolean;
  feedback: SerializedFeedback | null;
  order: {
    id: string;
    orderNumber: string;
    status: string;
    customerName: string;
    shippingCity: string;
  };
};

export function OrderFeedbackForm({
  orderId,
  orderStatus,
  accessToken,
  defaultName,
}: {
  orderId: string;
  orderStatus: string;
  accessToken?: string | null;
  defaultName?: string;
}) {
  const [state, setState] = useState<FeedbackState | null>(null);
  const [loadError, setLoadError] = useState("");
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState("");
  const [displayName, setDisplayName] = useState(defaultName ?? "");
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [thanks, setThanks] = useState(false);

  useEffect(() => {
    if (orderStatus !== "DELIVERED") return;
    let cancelled = false;
    (async () => {
      try {
        const qs = new URLSearchParams({ orderId });
        if (accessToken) qs.set("t", accessToken);
        const data = await authFetch<FeedbackState>(
          `/api/feedback?${qs.toString()}`,
        );
        if (cancelled) return;
        setState(data);
        setDisplayName((prev) => prev || data.order.customerName);
        if (data.feedback) setThanks(true);
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err instanceof Error ? err.message : "Unable to load feedback",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId, orderStatus, accessToken]);

  if (orderStatus !== "DELIVERED") return null;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setSubmitError("");
    try {
      const data = await authFetch<{ feedback: SerializedFeedback }>(
        "/api/feedback",
        {
          method: "POST",
          body: JSON.stringify({
            orderId,
            rating,
            message,
            displayName: displayName.trim() || undefined,
            accessToken: accessToken || undefined,
          }),
        },
      );
      setState((prev) =>
        prev
          ? { ...prev, feedback: data.feedback, eligible: false }
          : prev,
      );
      setThanks(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setBusy(false);
    }
  }

  if (loadError) {
    return (
      <div className="mt-10 border border-line bg-mist p-5">
        <p className="font-display text-[10px] tracking-[0.16em]">Feedback</p>
        <p className="mt-2 text-sm text-muted">{loadError}</p>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="mt-10 border border-line bg-mist p-5">
        <p className="font-serif text-sm text-muted">Checking feedback…</p>
      </div>
    );
  }

  if (thanks || state.feedback) {
    return (
      <div className="mt-10 border border-line bg-mist p-5">
        <p className="font-display text-[10px] tracking-[0.16em] text-kasavu-deep">
          Thank you
        </p>
        <p className="mt-2 font-serif text-lg text-charcoal">
          Your note on {state.order.orderNumber} is with us.
        </p>
        {state.feedback ? (
          <p className="mt-3 text-sm text-muted">
            {state.feedback.rating}/5 · “{state.feedback.message}”
          </p>
        ) : null}
      </div>
    );
  }

  if (!state.eligible) return null;

  return (
    <div className="mt-10 border border-line bg-mist p-5">
      <p className="font-display text-[10px] tracking-[0.16em] text-kasavu-deep">
        Feedback
      </p>
      <h2 className="mt-2 font-display text-xl tracking-[0.12em]">
        How was your order?
      </h2>
      <p className="mt-2 font-serif text-muted">
        One short note for {state.order.orderNumber} — helps us keep the
        boutique considered.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <fieldset>
          <legend className="font-display text-[10px] tracking-[0.16em]">
            Rating
          </legend>
          <div className="mt-2 flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                aria-label={`${n} star${n === 1 ? "" : "s"}`}
                className={cn(
                  "h-10 w-10 border font-display text-sm transition-colors",
                  rating >= n
                    ? "border-charcoal bg-charcoal text-ivory"
                    : "border-line bg-ivory text-muted",
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </fieldset>

        <div>
          <label
            htmlFor={`feedback-name-${orderId}`}
            className="font-display text-[10px] tracking-[0.16em]"
          >
            Display name
          </label>
          <input
            id={`feedback-name-${orderId}`}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={60}
            className="mt-2 w-full border border-charcoal/20 bg-ivory px-4 py-3 text-sm outline-none focus:border-kasavu"
          />
        </div>

        <div>
          <label
            htmlFor={`feedback-message-${orderId}`}
            className="font-display text-[10px] tracking-[0.16em]"
          >
            Your note
          </label>
          <textarea
            id={`feedback-message-${orderId}`}
            required
            minLength={20}
            maxLength={500}
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Fit, fabric, delivery — whatever mattered most."
            className="mt-2 w-full border border-charcoal/20 bg-ivory px-4 py-3 text-sm outline-none focus:border-kasavu"
          />
          <p className="mt-1 text-xs text-muted">{message.length}/500</p>
        </div>

        {submitError ? (
          <p className="text-sm text-sale">{submitError}</p>
        ) : null}

        <Button type="submit" variant="gold" disabled={busy}>
          {busy ? "Sending…" : "Send feedback"}
        </Button>
      </form>
    </div>
  );
}
