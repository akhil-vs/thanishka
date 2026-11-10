"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { authFetch } from "@/lib/auth/client";

export default function StudioLoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      await authFetch("/api/auth/staff/login", {
        method: "POST",
        body: JSON.stringify({
          email: String(form.get("email") ?? ""),
          password: String(form.get("password") ?? ""),
        }),
      });
      router.replace("/studio");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-svh bg-mist">
      <div className="mx-auto flex min-h-svh max-w-md flex-col justify-center px-4">
        <p className="font-display text-[11px] tracking-[0.28em] text-kasavu-deep">
          Thanishka · Boutique
        </p>
        <h1 className="mt-3 font-display text-3xl tracking-[0.14em]">
          Studio sign in
        </h1>
        <p className="mt-3 font-serif text-muted">
          Shop owner & staff — stock, catalogue, and campaigns for the floor.
        </p>
        <form onSubmit={onSubmit} className="mt-8 space-y-3">
          <input
            name="email"
            type="email"
            required
            defaultValue="admin@thanishka.com"
            placeholder="Email"
            className="w-full border border-line bg-ivory px-3 py-2.5 text-sm outline-none focus:border-kasavu"
          />
          <input
            name="password"
            type="password"
            required
            defaultValue="thanishka-admin"
            placeholder="Password"
            className="w-full border border-line bg-ivory px-3 py-2.5 text-sm outline-none focus:border-kasavu"
          />
          {error ? <p className="text-sm text-sale">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in…" : "Continue to Studio"}
          </Button>
        </form>
        <p className="mt-6 font-serif text-sm text-muted">
          Platform admin?{" "}
          <Link href="/admin/login" className="text-kasavu-deep hover:underline">
            Open Admin
          </Link>
        </p>
      </div>
    </div>
  );
}
