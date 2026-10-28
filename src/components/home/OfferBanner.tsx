"use client";

import { useEffect, useState } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";

type Offer = {
  id: string;
  title: string;
  eyebrow: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
};

const fallback: Offer = {
  id: "fallback",
  title: "Free Shipping Above ₹1,999",
  eyebrow: "Limited Weekend",
  subtitle:
    "Plus THANISHKA10 for 10% off your first order — email or WhatsApp welcome when you subscribe.",
  ctaLabel: "Shop the Offer",
  ctaHref: "/shop?sort=price-asc",
};

export function OfferBanner() {
  const [offer, setOffer] = useState<Offer>(fallback);

  useEffect(() => {
    fetch("/api/offers")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.offers) && data.offers[0]) {
          setOffer(data.offers[0]);
        }
      })
      .catch(() => {
        /* keep fallback */
      });
  }, []);

  return (
    <section className="relative overflow-hidden bg-emerald py-16 text-ivory md:py-20">
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, #b8956c55, transparent 40%), radial-gradient(circle at 80% 80%, #f8f5f022, transparent 35%)",
        }}
      />
      <Reveal className="container-page relative text-center">
        <p className="font-display text-[11px] tracking-[0.28em] text-kasavu">
          {offer.eyebrow || "Offer"}
        </p>
        <h2 className="mt-4 font-display text-3xl tracking-[0.14em] md:text-5xl">
          {offer.title}
        </h2>
        <p className="mx-auto mt-4 max-w-lg font-serif text-lg text-ivory/80">
          {offer.subtitle}
        </p>
        <div className="mt-8 flex justify-center">
          <ButtonLink href={offer.ctaHref} variant="gold">
            {offer.ctaLabel}
          </ButtonLink>
        </div>
      </Reveal>
    </section>
  );
}
