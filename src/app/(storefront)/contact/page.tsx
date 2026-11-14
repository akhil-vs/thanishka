import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/Button";
import { getStoreContact, whatsappHref } from "@/lib/store-contact";

export const metadata: Metadata = {
  title: "Contact & Visit",
  description:
    "Visit Thanishka boutique in Vellayambalam, Trivandrum or message us on WhatsApp.",
};

export default function ContactPage() {
  const contact = getStoreContact();
  const wa = whatsappHref("Hi Thanishka, I have a question");
  const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(contact.mapQuery)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;

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
          {contact.addressLine}
        </p>
        <dl className="mt-8 space-y-4 text-sm">
          <div>
            <dt className="font-display text-[10px] tracking-[0.16em] text-muted">
              Hours
            </dt>
            <dd className="mt-1">{contact.hours}</dd>
          </div>
          <div>
            <dt className="font-display text-[10px] tracking-[0.16em] text-muted">
              Phone / WhatsApp
            </dt>
            <dd className="mt-1">
              {contact.phone ? (
                <a href={`tel:${contact.phone}`} className="hover:underline">
                  {contact.phone}
                </a>
              ) : (
                <span className="text-muted">
                  Message us via email — WhatsApp number coming soon
                </span>
              )}
            </dd>
          </div>
          <div>
            <dt className="font-display text-[10px] tracking-[0.16em] text-muted">
              Email
            </dt>
            <dd className="mt-1">
              <a href={`mailto:${contact.email}`} className="hover:underline">
                {contact.email}
              </a>
            </dd>
          </div>
          {contact.instagram ? (
            <div>
              <dt className="font-display text-[10px] tracking-[0.16em] text-muted">
                Instagram
              </dt>
              <dd className="mt-1">
                <a
                  href={`https://instagram.com/${contact.instagram.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  @{contact.instagram.replace(/^@/, "")}
                </a>
              </dd>
            </div>
          ) : null}
        </dl>
        {wa ? (
          <ButtonLink href={wa} variant="gold" className="mt-8">
            Chat on WhatsApp
          </ButtonLink>
        ) : (
          <ButtonLink
            href={`mailto:${contact.email}`}
            variant="gold"
            className="mt-8"
          >
            Email the boutique
          </ButtonLink>
        )}
      </div>

      <div className="min-h-[320px] overflow-hidden border border-line bg-sand">
        <iframe
          title="Thanishka boutique map — Trivandrum"
          src={mapSrc}
          className="h-full min-h-[320px] w-full border-0 grayscale"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  );
}
