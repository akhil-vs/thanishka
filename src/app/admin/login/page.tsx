"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { adminFetch } from "@/lib/admin/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      await adminFetch("/api/admin/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: String(form.get("email") ?? ""),
          password: String(form.get("password") ?? ""),
        }),
      });
      router.replace("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-svh bg-charcoal text-ivory">
      <div className="mx-auto flex w-full max-w-md flex-col justify-center px-4 py-12">
        <p className="font-display text-[11px] tracking-[0.28em] text-kasavu">
          Thanishka · Platform
        </p>
        <h1 className="mt-3 font-display text-3xl tracking-[0.14em]">
          Admin sign in
        </h1>
        <p className="mt-3 font-serif text-ivory/65">
          Platform access, boutique settings, and system controls — not daily
          stock.
        </p>
        <form onSubmit={onSubmit} className="mt-8 space-y-3">
          <input
            name="email"
            type="email"
            required
            defaultValue="admin@thanishka.com"
            placeholder="Email"
            className="w-full border border-ivory/20 bg-ink px-3 py-2.5 text-sm text-ivory outline-none placeholder:text-ivory/40 focus:border-kasavu"
          />
          <input
            name="password"
            type="password"
            required
            defaultValue="thanishka-admin"
            placeholder="Password"
            className="w-full border border-ivory/20 bg-ink px-3 py-2.5 text-sm text-ivory outline-none placeholder:text-ivory/40 focus:border-kasavu"
          />
          {error ? <p className="text-sm text-sale">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in…" : "Continue to Admin"}
          </Button>
        </form>
        <p className="mt-6 font-serif text-sm text-ivory/55">
          Running the boutique floor?{" "}
          <Link href="/studio/login" className="text-kasavu hover:underline">
            Open Studio
          </Link>
        </p>
      </div>
    </div>
  );
}
