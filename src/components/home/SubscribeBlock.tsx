"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";

export function SubscribeBlock() {
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState(false);
  const [done, setDone] = useState(false);

  return (
    <section className="py-20 md:py-28">
      <Reveal className="container-page max-w-2xl text-center">
        <p className="font-display text-[11px] tracking-[0.22em] text-kasavu-deep">
          Stay Close
        </p>
        <h2 className="mt-2 font-display text-2xl tracking-[0.16em] md:text-3xl">
          First looks & festive drops
        </h2>
        <p className="mt-3 font-serif text-lg text-muted">
          Subscribe for early access and 10% off your first order.
        </p>
        <form
          className="mt-8 flex flex-col gap-3 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            setDone(true);
          }}
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email"
            className="flex-1 border border-charcoal/20 bg-transparent px-4 py-3 text-sm outline-none focus:border-kasavu"
          />
          <Button type="submit" variant="primary">
            {done ? "You’re in" : "Join"}
          </Button>
        </form>
        <label className="mt-4 inline-flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={whatsapp}
            onChange={(e) => setWhatsapp(e.target.checked)}
            className="accent-emerald"
          />
          Also send offers on WhatsApp
        </label>
        {done && (
          <p className="mt-4 text-sm text-emerald">
            Welcome — use THANISHKA10 at checkout.
          </p>
        )}
      </Reveal>
    </section>
  );
}
