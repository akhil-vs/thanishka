import { Collections } from "@/components/home/Collections";
import { Hero } from "@/components/home/Hero";
import { NewIn } from "@/components/home/NewIn";
import { OfferBanner } from "@/components/home/OfferBanner";
import { ShopTheFeed } from "@/components/home/ShopTheFeed";
import { SubscribeBlock } from "@/components/home/SubscribeBlock";
import { Testimonials } from "@/components/home/Testimonials";

export default function HomePage() {
  return (
    <>
      <Hero />
      <NewIn />
      <Collections />
      <OfferBanner />
      <ShopTheFeed />
      <Testimonials />
      <SubscribeBlock />
    </>
  );
}
