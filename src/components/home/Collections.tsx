import Image from "next/image";
import Link from "next/link";
import { collections } from "@/lib/products";
import { Reveal } from "@/components/ui/Reveal";

export function Collections() {
  return (
    <section className="bg-mist py-20 md:py-28">
      <div className="container-page">
        <Reveal className="mb-10 max-w-xl">
          <p className="font-display text-[11px] tracking-[0.22em] text-kasavu-deep">
            Featured
          </p>
          <h2 className="mt-2 font-display text-2xl tracking-[0.16em] md:text-3xl">
            Collections
          </h2>
          <p className="mt-3 font-serif text-lg text-muted">
            Seasonal edits shaped for Trivandrum — festive, party, and everyday.
          </p>
        </Reveal>

        <div className="grid gap-4 md:grid-cols-3 md:gap-5">
          {collections.map((c, i) => (
            <Reveal key={c.slug} delay={i * 0.08}>
              <Link
                href={`/shop?category=${c.slug === "onam-edit" ? "festive" : c.slug === "party-night" ? "party-western" : "co-ords"}`}
                className="group relative block aspect-[4/5] overflow-hidden bg-sand"
              >
                <Image
                  src={c.image}
                  alt={c.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-ivory">
                  <h3 className="font-display text-lg tracking-[0.18em]">
                    {c.title}
                  </h3>
                  <p className="mt-2 font-serif text-sm text-ivory/80">
                    {c.subtitle}
                  </p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
