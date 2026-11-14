"use client";

import { useEffect, useState } from "react";
import { testimonials as fallbackTestimonials } from "@/lib/products";
import { Reveal } from "@/components/ui/Reveal";
import type { PublicTestimonial } from "@/lib/feedback/types";

type DisplayQuote = {
  id: string;
  quote: string;
  name: string;
  place: string;
};

const fallback: DisplayQuote[] = fallbackTestimonials.map((t, i) => ({
  id: `fallback-${i}`,
  quote: t.quote,
  name: t.name,
  place: t.place,
}));

export function Testimonials() {
  const [items, setItems] = useState<DisplayQuote[]>(fallback);

  useEffect(() => {
    fetch("/api/feedback/public?limit=6")
      .then((res) => res.json())
      .then((data) => {
        if (
          Array.isArray(data.testimonials) &&
          data.testimonials.length > 0
        ) {
          setItems(
            (data.testimonials as PublicTestimonial[]).map((t) => ({
              id: t.id,
              quote: t.quote,
              name: t.name,
              place: t.place,
            })),
          );
        }
      })
      .catch(() => {
        /* keep fallback */
      });
  }, []);

  return (
    <section className="border-y border-line bg-mist py-20 md:py-24">
      <div className="container-page">
        <Reveal className="mb-12 text-center">
          <h2 className="font-display text-2xl tracking-[0.16em] md:text-3xl">
            From Trivandrum
          </h2>
        </Reveal>
        <div className="grid gap-10 md:grid-cols-3 md:gap-8">
          {items.slice(0, 3).map((t, i) => (
            <Reveal key={t.id} delay={i * 0.08} className="text-center md:text-left">
              <p className="font-serif text-xl leading-relaxed text-charcoal">
                “{t.quote}”
              </p>
              <p className="mt-5 font-display text-[11px] tracking-[0.18em]">
                {t.name}
              </p>
              <p className="mt-1 text-sm text-muted">{t.place}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
