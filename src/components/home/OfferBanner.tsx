import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";

export function OfferBanner() {
  return (
    <section className="relative overflow-hidden bg-emerald py-16 text-ivory md:py-20">
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, #b8956c55, transparent 40%), radial-gradient(circle at 80% 80%, #f8f5f022, transparent 35%)",
        }}
      />
      <Reveal className="container-page relative text-center">
        <p className="font-display text-[11px] tracking-[0.28em] text-kasavu">
          Limited Weekend
        </p>
        <h2 className="mt-4 font-display text-3xl tracking-[0.14em] md:text-5xl">
          Free Shipping Above ₹1,999
        </h2>
        <p className="mx-auto mt-4 max-w-lg font-serif text-lg text-ivory/80">
          Plus THANISHKA10 for 10% off your first order — email or WhatsApp
          welcome when you subscribe.
        </p>
        <div className="mt-8 flex justify-center">
          <ButtonLink href="/shop?sort=price-asc" variant="gold">
            Shop the Offer
          </ButtonLink>
        </div>
      </Reveal>
    </section>
  );
}
