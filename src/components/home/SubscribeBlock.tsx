import { Reveal } from "@/components/ui/Reveal";
import { SubscribeForm } from "@/components/home/SubscribeForm";

export function SubscribeBlock() {
  return (
    <section className="py-20 md:py-28">
      <Reveal className="container-page max-w-2xl text-center">
        <p className="font-display text-[11px] tracking-[0.22em] text-kasavu-deep">
          Stay Close
        </p>
        <h2 className="mt-2 font-display text-2xl tracking-[0.16em] md:text-3xl">
          First looks & festive drops
        </h2>
        <p className="mt-3 font-serif text-lg text-muted">
          Subscribe for early access and 10% off your first order.
        </p>
        <div className="mx-auto max-w-md text-left sm:text-center">
          <SubscribeForm source="home-block" variant="block" />
        </div>
      </Reveal>
    </section>
  );
}
