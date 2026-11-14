"use client";

import Link from "next/link";
import { SubscribeForm } from "@/components/home/SubscribeForm";

const columns = [
  {
    title: "Shop",
    links: [
      { href: "/shop?category=new-in", label: "New In" },
      { href: "/shop?category=party-western", label: "Party & Western" },
      { href: "/shop?category=festive", label: "Festive" },
      { href: "/shop?category=co-ords", label: "Co-ords" },
    ],
  },
  {
    title: "Help",
    links: [
      { href: "/shipping", label: "Shipping" },
      { href: "/returns", label: "Returns" },
      { href: "/faq", label: "FAQ" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "House",
    links: [
      { href: "/about", label: "About" },
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
      { href: "/account", label: "Account" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-line bg-mist">
      <div className="container-page grid gap-12 py-16 md:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="font-display text-xl tracking-[0.28em] text-ink">
            Thanishka
          </p>
          <p className="mt-4 max-w-md font-serif text-lg leading-relaxed text-muted">
            Readymade women&apos;s dresses from Trivandrum — editorial cuts,
            kasavu accents, sizes XS–XXL.
          </p>
          <div className="max-w-md">
            <SubscribeForm source="footer" variant="footer" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {columns.map((col) => (
            <div key={col.title}>
              <p className="font-display text-[11px] tracking-[0.2em] text-charcoal">
                {col.title}
              </p>
              <ul className="mt-4 space-y-2">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="font-serif text-sm text-muted transition hover:text-charcoal"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-line">
        <div className="container-page flex flex-col gap-2 py-5 text-sm text-muted md:flex-row md:items-center md:justify-between">
          <p>© 2026 Thanishka Boutique · GST ready</p>
          <p className="font-serif italic">
            Vellayambalam, Thiruvananthapuram, Kerala
          </p>
        </div>
      </div>
    </footer>
  );
}
