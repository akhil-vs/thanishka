import type { Metadata } from "next";

export const metadata: Metadata = { title: "Returns & Exchanges" };

export default function ReturnsPage() {
  return (
    <div className="container-page max-w-2xl py-12 md:py-16">
      <h1 className="font-display text-3xl tracking-[0.14em]">
        Returns & Exchanges
      </h1>
      <div className="mt-8 space-y-4 font-serif text-lg leading-relaxed text-muted">
        <p>
          Exchange within 7 days of delivery for unused pieces with original
          tags. Size exchanges are prioritised subject to stock.
        </p>
        <p>
          Sale items and festive set-sarees may be exchange-only. Start a request
          from your account or WhatsApp us with your order ID.
        </p>
        <p>
          Refunds (where applicable) return to the original payment method
          within 5–7 business days after inspection.
        </p>
      </div>
    </div>
  );
}
