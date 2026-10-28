"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export default function AccountPage() {
  const [mode, setMode] = useState<"otp" | "email">("otp");
  const [signedIn, setSignedIn] = useState(false);

  if (signedIn) {
    return (
      <div className="container-page max-w-3xl py-12 md:py-16">
        <h1 className="font-display text-3xl tracking-[0.14em]">Account</h1>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {[
            ["Order history", "Track Placed → Packed → Shipped → Delivered"],
            ["Addresses", "Saved Trivandrum & shipping addresses"],
            ["Wishlist", "Dresses you’ve hearted"],
            ["Returns", "Request exchange or return"],
          ].map(([title, body]) => (
            <div key={title} className="border border-line p-5">
              <h2 className="font-display text-[11px] tracking-[0.16em]">
                {title}
              </h2>
              <p className="mt-2 font-serif text-muted">{body}</p>
            </div>
          ))}
        </div>
        <Button
          className="mt-8"
          variant="secondary"
          onClick={() => setSignedIn(false)}
        >
          Sign out
        </Button>
      </div>
    );
  }

  return (
    <div className="container-page max-w-md py-16">
      <h1 className="font-display text-3xl tracking-[0.14em]">Sign in</h1>
      <p className="mt-3 font-serif text-muted">
        OTP or email — your orders, wishlist and returns in one place.
      </p>
      <div className="mt-6 flex gap-2">
        <button
          className={`flex-1 border px-3 py-2 font-display text-[10px] tracking-[0.14em] ${
            mode === "otp" ? "border-charcoal bg-charcoal text-ivory" : "border-line"
          }`}
          onClick={() => setMode("otp")}
        >
          OTP
        </button>
        <button
          className={`flex-1 border px-3 py-2 font-display text-[10px] tracking-[0.14em] ${
            mode === "email" ? "border-charcoal bg-charcoal text-ivory" : "border-line"
          }`}
          onClick={() => setMode("email")}
        >
          Email
        </button>
      </div>
      <form
        className="mt-6 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          setSignedIn(true);
        }}
      >
        {mode === "otp" ? (
          <>
            <input
              required
              placeholder="Mobile number"
              className="w-full border border-line px-3 py-2.5 text-sm outline-none focus:border-kasavu"
            />
            <input
              placeholder="OTP (demo: any 4 digits)"
              className="w-full border border-line px-3 py-2.5 text-sm outline-none focus:border-kasavu"
            />
          </>
        ) : (
          <>
            <input
              required
              type="email"
              placeholder="Email"
              className="w-full border border-line px-3 py-2.5 text-sm outline-none focus:border-kasavu"
            />
            <input
              required
              type="password"
              placeholder="Password"
              className="w-full border border-line px-3 py-2.5 text-sm outline-none focus:border-kasavu"
            />
          </>
        )}
        <Button type="submit" className="w-full">
          Continue
        </Button>
      </form>
    </div>
  );
}
