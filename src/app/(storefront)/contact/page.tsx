import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Contact & Visit",
  description:
    "Visit Thanishka boutique in Vellayambalam, Trivandrum or message us on WhatsApp.",
};

export default function ContactPage() {
  return (
    <div className="container-page grid gap-12 py-12 md:grid-cols-2 md:py-16">
      <div>
        <p className="font-display text-[11px] tracking-[0.22em] text-kasavu-deep">
          Visit
        </p>
        <h1 className="mt-2 font-display text-3xl tracking-[0.14em]">
          Boutique
        </h1>
        <p className="mt-4 font-serif text-xl text-muted">
          Vellayambalam, Thiruvananthapuram, Kerala 695010
        </p>
        <dl className="mt-8 space-y-4 text-sm">
          <div>
            <dt className="font-display text-[10px] tracking-[0.16em] text-muted">
              Hours
            </dt>
            <dd className="mt-1">Mon–Sun · 10:30am – 8:00pm</dd>
          </div>
          <div>
            <dt className="font-display text-[10px] tracking-[0.16em] text-muted">
              Phone / WhatsApp
            </dt>
            <dd className="mt-1">+91 98765 43210</dd>
          </div>
          <div>
            <dt className="font-display text-[10px] tracking-[0.16em] text-muted">
              Email
            </dt>
            <dd className="mt-1">hello@thanishka.store</dd>
          </div>
        </dl>
        <ButtonLink
          href="https://wa.me/919876543210"
          variant="gold"
          className="mt-8"
        >
          Chat on WhatsApp
        </ButtonLink>
      </div>

      <div className="min-h-[320px] overflow-hidden border border-line bg-sand">
        <iframe
          title="Thanishka boutique map — Trivandrum"
          src="https://maps.google.com/maps?q=Vellayambalam%20Thiruvananthapuram&t=&z=14&ie=UTF8&iwloc=&output=embed"
          className="h-full min-h-[320px] w-full border-0 grayscale"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  );
}
