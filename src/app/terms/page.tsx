import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <div className="container-page max-w-2xl py-12 md:py-16">
      <h1 className="font-display text-3xl tracking-[0.14em]">Terms</h1>
      <div className="mt-8 space-y-4 font-serif text-lg leading-relaxed text-muted">
        <p>
          By shopping at Thanishka you agree that products are sold as readymade
          garments sized XS–XXL, that descriptions and photography are
          representative, and that prices include applicable GST unless stated.
        </p>
        <p>
          Coupons, flash sales and free-shipping thresholds are subject to the
          rules shown at checkout. We may refuse orders that appear fraudulent
          or cannot be fulfilled due to stock.
        </p>
        <p>Governing law: India · Courts of Thiruvananthapuram.</p>
      </div>
    </div>
  );
}
