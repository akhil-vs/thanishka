"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";

export function SubscribeForm({
  source,
  variant = "block",
}: {
  source: string;
  variant?: "block" | "footer" | "popup";
}) {
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          whatsappOptIn: whatsapp,
          source,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Could not subscribe");
      setDone(true);
      if (variant === "popup") {
        localStorage.setItem("thanishka-sub-dismissed", "1");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not subscribe");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <p className="mt-4 text-sm text-emerald">
        Welcome — use THANISHKA10 at checkout for 10% off your first order.
      </p>
    );
  }

  const inputClass =
    variant === "footer"
      ? "flex-1 border border-charcoal/20 bg-ivory px-4 py-3 text-sm outline-none focus:border-kasavu"
      : "w-full border border-charcoal/20 bg-transparent px-4 py-3 text-sm outline-none focus:border-kasavu";

  return (
    <form className="mt-6 space-y-3" onSubmit={onSubmit}>
      <div
        className={
          variant === "popup"
            ? "flex flex-col gap-3"
            : "flex flex-col gap-3 sm:flex-row"
        }
      >
        {variant === "footer" ? (
          <label className="sr-only" htmlFor="footer-email">
            Email
          </label>
        ) : null}
        <input
          id={variant === "footer" ? "footer-email" : undefined}
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={
            variant === "footer"
              ? "Email for 10% off"
              : variant === "popup"
                ? "Email address"
                : "Your email"
          }
          className={inputClass}
        />
        <Button
          type="submit"
          variant={
            variant === "footer" || variant === "popup" ? "gold" : "primary"
          }
          disabled={busy}
          className={variant === "popup" ? "w-full" : undefined}
        >
          {busy
            ? "Saving…"
            : variant === "popup"
              ? "Get my code"
              : variant === "footer"
                ? "Subscribe"
                : "Join"}
        </Button>
      </div>
      {variant === "block" ? (
        <label className="inline-flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={whatsapp}
            onChange={(e) => setWhatsapp(e.target.checked)}
            className="accent-emerald"
          />
          Also send offers on WhatsApp
        </label>
      ) : null}
      {error ? <p className="text-sm text-sale">{error}</p> : null}
    </form>
  );
}
