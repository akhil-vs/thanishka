import Image from "next/image";
import Link from "next/link";
import { feedImages } from "@/lib/products";
import { getStoreContact } from "@/lib/store-contact";
import { Reveal } from "@/components/ui/Reveal";

export function ShopTheFeed() {
  const contact = getStoreContact();
  const handle = contact.instagram?.replace(/^@/, "") || null;

  return (
    <section className="py-20 md:py-28">
      <div className="container-page">
        <Reveal className="mb-10 text-center">
          <p className="font-display text-[11px] tracking-[0.22em] text-kasavu-deep">
            {handle ? `@${handle}` : "Boutique diary"}
          </p>
          <h2 className="mt-2 font-display text-2xl tracking-[0.16em] md:text-3xl">
            Shop the Feed
          </h2>
          <p className="mx-auto mt-3 max-w-md font-serif text-lg text-muted">
            Editorial looks styled for Trivandrum light — tap through to shop the
            full edit.
          </p>
        </Reveal>

        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-3">
          {feedImages.map((src, i) => (
            <Reveal key={src} delay={i * 0.04}>
              <Link
                href="/shop"
                className="group relative block aspect-square overflow-hidden bg-sand"
              >
                <Image
                  src={src}
                  alt={`Boutique look ${i + 1}`}
                  fill
                  sizes="(max-width: 768px) 50vw, 33vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-ink/0 opacity-0 transition group-hover:bg-ink/35 group-hover:opacity-100">
                  <span className="font-display text-[11px] tracking-[0.2em] text-ivory">
                    Shop
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
        {handle ? (
          <p className="mt-8 text-center">
            <a
              href={`https://instagram.com/${handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-display text-[11px] tracking-[0.18em] text-muted underline-offset-4 hover:text-charcoal hover:underline"
            >
              Follow @{handle}
            </a>
          </p>
        ) : null}
      </div>
    </section>
  );
}
