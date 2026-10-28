import Link from "next/link";
import { products } from "@/lib/products";
import { ProductCard } from "@/components/product/ProductCard";
import { Reveal } from "@/components/ui/Reveal";

export function NewIn() {
  const items = products.filter((p) => p.isNew).slice(0, 8);

  return (
    <section className="py-20 md:py-28">
      <div className="container-page">
        <Reveal className="mb-10 flex items-end justify-between gap-4">
          <div>
            <p className="font-display text-[11px] tracking-[0.22em] text-kasavu-deep">
              Just Arrived
            </p>
            <h2 className="mt-2 font-display text-2xl tracking-[0.16em] md:text-3xl">
              New In
            </h2>
          </div>
          <Link
            href="/shop?category=new-in"
            className="font-display text-[11px] tracking-[0.18em] text-muted underline-offset-4 hover:text-charcoal hover:underline"
          >
            View all
          </Link>
        </Reveal>

        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide md:grid md:grid-cols-4 md:gap-6 md:overflow-visible">
          {items.map((product, i) => (
            <div
              key={product.id}
              className="w-[68vw] shrink-0 sm:w-[42vw] md:w-auto"
            >
              <Reveal delay={i * 0.05}>
                <ProductCard product={product} priority={i < 2} />
              </Reveal>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
