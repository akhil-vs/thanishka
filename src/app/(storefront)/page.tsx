import { Suspense } from "react";
import { Collections } from "@/components/home/Collections";
import { Hero } from "@/components/home/Hero";
import { NewIn } from "@/components/home/NewIn";
import { OfferBanner } from "@/components/home/OfferBanner";
import { ShopTheFeed } from "@/components/home/ShopTheFeed";
import { SubscribeBlock } from "@/components/home/SubscribeBlock";
import { Testimonials } from "@/components/home/Testimonials";

function NewInFallback() {
  return (
    <section className="container-page py-20 font-serif text-muted md:py-28">
      Loading new arrivals…
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <Suspense fallback={<NewInFallback />}>
        <NewIn />
      </Suspense>
      <Collections />
      <OfferBanner />
      <ShopTheFeed />
      <Testimonials />
      <SubscribeBlock />
    </>
  );
}
