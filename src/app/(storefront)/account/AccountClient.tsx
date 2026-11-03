"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { authFetch } from "@/lib/auth/client";
import type { PublicUser } from "@/lib/auth/types";

type Address = {
  id: string;
  label: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  phone: string | null;
  isDefault: boolean;
};

export type MeResponse = {
  user: PublicUser;
  addresses: Address[];
};

export function AccountClient({ initial }: { initial: MeResponse | null }) {
  const [mode, setMode] = useState<"otp" | "email" | "register">("otp");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [me, setMe] = useState<MeResponse | null>(initial);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [maskedPhone, setMaskedPhone] = useState("");
  const [showAddressForm, setShowAddressForm] = useState(false);

  async function refreshMe() {
    const data = await authFetch<MeResponse>("/api/auth/customer/me");
    setMe(data);
  }

  async function requestOtp(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const form = new FormData(e.currentTarget);
    try {
      const res = await authFetch<{
        challengeId: string;
        phone: string;
        devCode?: string;
      }>("/api/auth/customer/otp/request", {
        method: "POST",
        body: JSON.stringify({ phone: String(form.get("phone") ?? "") }),
      });
      setChallengeId(res.challengeId);
      setMaskedPhone(res.phone);
      setDevCode(res.devCode ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send OTP");
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!challengeId) return;
    setError("");
    setBusy(true);
    const form = new FormData(e.currentTarget);
    try {
      await authFetch("/api/auth/customer/otp/verify", {
        method: "POST",
        body: JSON.stringify({
          challengeId,
          code: String(form.get("code") ?? ""),
          name: String(form.get("name") ?? "") || undefined,
        }),
      });
      setChallengeId(null);
      setDevCode(null);
      await refreshMe();
    } catch (err) {
      setError(err instanceof Error ? err.message : "OTP verification failed");
    } finally {
      setBusy(false);
    }
  }

  async function emailAuth(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const form = new FormData(e.currentTarget);
    const path =
      mode === "register"
        ? "/api/auth/customer/register"
        : "/api/auth/customer/login";
    try {
      await authFetch(path, {
        method: "POST",
        body: JSON.stringify({
          email: String(form.get("email") ?? ""),
          password: String(form.get("password") ?? ""),
          ...(mode === "register"
            ? {
                name: String(form.get("name") ?? ""),
                phone: String(form.get("phone") ?? "") || undefined,
              }
            : {}),
        }),
      });
      await refreshMe();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    setBusy(true);
    try {
      await authFetch("/api/auth/customer/logout", { method: "POST" });
      setMe(null);
      setShowAddressForm(false);
    } finally {
      setBusy(false);
    }
  }

  async function saveAddress(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const form = new FormData(e.currentTarget);
    try {
      await authFetch("/api/account/addresses", {
        method: "POST",
        body: JSON.stringify({
          label: String(form.get("label") ?? "Home"),
          line1: String(form.get("line1") ?? ""),
          line2: String(form.get("line2") ?? "") || null,
          city: String(form.get("city") ?? ""),
          state: String(form.get("state") ?? "Kerala"),
          postalCode: String(form.get("postalCode") ?? ""),
          phone: String(form.get("phone") ?? "") || null,
          isDefault: form.get("isDefault") === "on",
        }),
      });
      setShowAddressForm(false);
      await refreshMe();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save address");
    } finally {
      setBusy(false);
    }
  }

  async function removeAddress(id: string) {
    setBusy(true);
    try {
      await authFetch(`/api/account/addresses/${id}`, { method: "DELETE" });
      await refreshMe();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove address");
    } finally {
      setBusy(false);
    }
  }

  if (me) {
    return (
      <div className="container-page max-w-3xl py-12 md:py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl tracking-[0.14em]">Account</h1>
            <p className="mt-2 font-serif text-muted">
              {me.user.name}
              {me.user.phone ? ` · ${me.user.phone}` : ""}
              {me.user.email ? ` · ${me.user.email}` : ""}
            </p>
          </div>
          <Button variant="secondary" onClick={signOut} disabled={busy}>
            Sign out
          </Button>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {[
            ["Order history", "Coming with checkout — Placed → Packed → Shipped"],
            ["Wishlist", "Synced wishlist lands with the next commerce pass"],
            ["Returns", "Request exchange or return from delivered orders"],
          ].map(([title, body]) => (
            <div key={title} className="border border-line p-5">
              <h2 className="font-display text-[11px] tracking-[0.16em]">
                {title}
              </h2>
              <p className="mt-2 font-serif text-muted">{body}</p>
            </div>
          ))}
        </div>

        <section className="mt-10 border border-line p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-[11px] tracking-[0.16em]">
              Addresses
            </h2>
            <button
              type="button"
              className="font-display text-[10px] tracking-[0.14em] text-kasavu-deep"
              onClick={() => setShowAddressForm((v) => !v)}
            >
              {showAddressForm ? "Cancel" : "Add address"}
            </button>
          </div>

          {error ? <p className="mt-3 text-sm text-sale">{error}</p> : null}

          {showAddressForm ? (
            <form onSubmit={saveAddress} className="mt-4 grid gap-3 md:grid-cols-2">
              <input
                name="label"
                placeholder="Label (Home)"
                defaultValue="Home"
                className="border border-line px-3 py-2.5 text-sm outline-none focus:border-kasavu md:col-span-2"
              />
              <input
                name="line1"
                required
                placeholder="Address line 1"
                className="border border-line px-3 py-2.5 text-sm outline-none focus:border-kasavu md:col-span-2"
              />
              <input
                name="line2"
                placeholder="Address line 2"
                className="border border-line px-3 py-2.5 text-sm outline-none focus:border-kasavu md:col-span-2"
              />
              <input
                name="city"
                required
                defaultValue="Thiruvananthapuram"
                placeholder="City"
                className="border border-line px-3 py-2.5 text-sm outline-none focus:border-kasavu"
              />
              <input
                name="postalCode"
                required
                placeholder="PIN code"
                className="border border-line px-3 py-2.5 text-sm outline-none focus:border-kasavu"
              />
              <input
                name="state"
                defaultValue="Kerala"
                placeholder="State"
                className="border border-line px-3 py-2.5 text-sm outline-none focus:border-kasavu"
              />
              <input
                name="phone"
                placeholder="Phone"
                className="border border-line px-3 py-2.5 text-sm outline-none focus:border-kasavu"
              />
              <label className="flex items-center gap-2 font-serif text-sm text-muted md:col-span-2">
                <input name="isDefault" type="checkbox" />
                Default shipping address
              </label>
              <Button type="submit" className="md:col-span-2" disabled={busy}>
                Save address
              </Button>
            </form>
          ) : null}

          <ul className="mt-4 space-y-3">
            {me.addresses.length === 0 ? (
              <li className="font-serif text-sm text-muted">
                No saved addresses yet.
              </li>
            ) : (
              me.addresses.map((a) => (
                <li
                  key={a.id}
                  className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-3"
                >
                  <div>
                    <p className="font-display text-[10px] tracking-[0.14em]">
                      {a.label}
                      {a.isDefault ? " · Default" : ""}
                    </p>
                    <p className="mt-1 font-serif text-sm text-muted">
                      {a.line1}
                      {a.line2 ? `, ${a.line2}` : ""}
                      <br />
                      {a.city}, {a.state} {a.postalCode}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="font-display text-[10px] tracking-[0.14em] text-sale"
                    onClick={() => removeAddress(a.id)}
                    disabled={busy}
                  >
                    Remove
                  </button>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    );
  }

  return (
    <div className="container-page max-w-md py-16">
      <h1 className="font-display text-3xl tracking-[0.14em]">Sign in</h1>
      <p className="mt-3 font-serif text-muted">
        OTP or email — your addresses and (soon) orders in one place.
      </p>
      <div className="mt-6 flex gap-2">
        {(
          [
            ["otp", "OTP"],
            ["email", "Email"],
            ["register", "Register"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={`flex-1 border px-3 py-2 font-display text-[10px] tracking-[0.14em] ${
              mode === value
                ? "border-charcoal bg-charcoal text-ivory"
                : "border-line"
            }`}
            onClick={() => {
              setMode(value);
              setChallengeId(null);
              setDevCode(null);
              setError("");
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {error ? <p className="mt-4 text-sm text-sale">{error}</p> : null}

      {mode === "otp" ? (
        challengeId ? (
          <form className="mt-6 space-y-3" onSubmit={verifyOtp}>
            <p className="font-serif text-sm text-muted">
              Code sent to {maskedPhone}
              {devCode ? ` · Dev code ${devCode}` : ""}
            </p>
            <input
              name="name"
              placeholder="Your name (optional)"
              className="w-full border border-line px-3 py-2.5 text-sm outline-none focus:border-kasavu"
            />
            <input
              name="code"
              required
              placeholder="OTP"
              className="w-full border border-line px-3 py-2.5 text-sm outline-none focus:border-kasavu"
            />
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Verifying…" : "Verify & continue"}
            </Button>
            <button
              type="button"
              className="w-full font-display text-[10px] tracking-[0.14em] text-muted"
              onClick={() => {
                setChallengeId(null);
                setDevCode(null);
              }}
            >
              Use a different number
            </button>
          </form>
        ) : (
          <form className="mt-6 space-y-3" onSubmit={requestOtp}>
            <input
              name="phone"
              required
              placeholder="Mobile number"
              className="w-full border border-line px-3 py-2.5 text-sm outline-none focus:border-kasavu"
            />
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Sending…" : "Send OTP"}
            </Button>
          </form>
        )
      ) : (
        <form className="mt-6 space-y-3" onSubmit={emailAuth}>
          {mode === "register" ? (
            <>
              <input
                name="name"
                required
                placeholder="Name"
                className="w-full border border-line px-3 py-2.5 text-sm outline-none focus:border-kasavu"
              />
              <input
                name="phone"
                placeholder="Mobile (optional)"
                className="w-full border border-line px-3 py-2.5 text-sm outline-none focus:border-kasavu"
              />
            </>
          ) : null}
          <input
            name="email"
            required
            type="email"
            placeholder="Email"
            className="w-full border border-line px-3 py-2.5 text-sm outline-none focus:border-kasavu"
          />
          <input
            name="password"
            required
            type="password"
            placeholder="Password"
            className="w-full border border-line px-3 py-2.5 text-sm outline-none focus:border-kasavu"
          />
          <Button type="submit" className="w-full" disabled={busy}>
            {busy
              ? "Please wait…"
              : mode === "register"
                ? "Create account"
                : "Continue"}
          </Button>
        </form>
      )}
    </div>
  );
}
