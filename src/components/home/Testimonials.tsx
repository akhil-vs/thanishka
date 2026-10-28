import { testimonials } from "@/lib/products";
import { Reveal } from "@/components/ui/Reveal";

export function Testimonials() {
  return (
    <section className="border-y border-line bg-mist py-20 md:py-24">
      <div className="container-page">
        <Reveal className="mb-12 text-center">
          <h2 className="font-display text-2xl tracking-[0.16em] md:text-3xl">
            From Trivandrum
          </h2>
        </Reveal>
        <div className="grid gap-10 md:grid-cols-3 md:gap-8">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.08} className="text-center md:text-left">
              <p className="font-serif text-xl leading-relaxed text-charcoal">
                “{t.quote}”
              </p>
              <p className="mt-5 font-display text-[11px] tracking-[0.18em]">
                {t.name}
              </p>
              <p className="mt-1 text-sm text-muted">{t.place}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
