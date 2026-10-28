import type { Metadata } from "next";
import Image from "next/image";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "About",
  description:
    "Thanishka is a modern boutique for readymade women's dresses in Trivandrum, Kerala.",
};

export default function AboutPage() {
  return (
    <div>
      <section className="relative h-[48vh] min-h-[320px] overflow-hidden bg-charcoal">
        <Image
          src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1800&q=80"
          alt="Boutique interior"
          fill
          className="object-cover opacity-70"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 container-page pb-10 text-ivory">
          <p className="font-display text-[11px] tracking-[0.28em] text-kasavu">
            Our House
          </p>
          <h1 className="mt-3 font-display text-4xl tracking-[0.14em] md:text-5xl">
            Thanishka
          </h1>
        </div>
      </section>

      <section className="container-page max-w-3xl py-16 md:py-24">
        <p className="font-serif text-2xl leading-relaxed text-charcoal md:text-3xl">
          A Trivandrum boutique for women who want editorial dressing without
          the wait of custom stitching — party, festive and everyday, sized
          XS–XXL.
        </p>
        <p className="mt-8 text-muted leading-relaxed">
          We stock readymade kurtis, co-ords, gowns, anarkalis and set-saree
          styles with a quiet Kerala signature: ivory grounds, kasavu-gold
          accents, and collections timed for Onam, Vishu, Eid and Christmas.
          Visit us in Vellayambalam or shop the same rails online.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <ButtonLink href="/shop">Shop New</ButtonLink>
          <ButtonLink href="/contact" variant="secondary">
            Visit the boutique
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}
