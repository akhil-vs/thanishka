import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { whatsappHref } from "@/lib/store-contact";

export const metadata: Metadata = { title: "Returns & Exchanges" };

export default function ReturnsPage() {
  const wa = whatsappHref(
    "Hi Thanishka, I’d like to start an exchange or return. My order ID is ",
  );

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
          from your{" "}
          <Link href="/account" className="text-charcoal underline underline-offset-2">
            account
          </Link>{" "}
          order history, or message us on WhatsApp with your order number.
        </p>
        <p>
          Refunds (where applicable) return to the original payment method
          within 5–7 business days after inspection.
        </p>
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        {wa ? (
          <ButtonLink href={wa} variant="gold">
            WhatsApp returns desk
          </ButtonLink>
        ) : null}
        <ButtonLink href="/account" variant="secondary">
          Open account
        </ButtonLink>
      </div>
    </div>
  );
}
