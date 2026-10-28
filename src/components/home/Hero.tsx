"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { ButtonLink } from "@/components/ui/Button";

type Slide = {
  id?: string;
  title: string;
  subtitle: string;
  cta: string;
  href: string;
  image: string;
};

const fallbackSlides: Slide[] = [
  {
    title: "Shop New",
    subtitle:
      "Readymade dresses for Kerala light — from kasavu borders to evening gowns.",
    cta: "Explore New In",
    href: "/shop?category=new-in",
    image:
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=2000&q=80",
  },
];

export function Hero() {
  const [slides, setSlides] = useState<Slide[]>(fallbackSlides);
  const [index, setIndex] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    fetch("/api/hero")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.slides) && data.slides.length > 0) {
          setSlides(data.slides);
        }
      })
      .catch(() => {
        /* keep fallback */
      });
  }, []);

  useEffect(() => {
    if (reduce || slides.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 6500);
    return () => clearInterval(id);
  }, [reduce, slides.length]);

  const slide = slides[index] ?? slides[0];

  return (
    <section className="relative h-[100svh] min-h-[560px] w-full overflow-hidden bg-charcoal">
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.image + slide.title}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 1.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <Image
            src={slide.image}
            alt=""
            fill
            priority
            className="hero-parallax object-cover object-center"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/25 to-ink/10" />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 flex h-full flex-col justify-end pb-24 md:justify-center md:pb-0">
        <div className="container-page max-w-3xl text-ivory">
          <motion.p
            key={`brand-${index}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="font-display text-sm tracking-[0.45em] text-kasavu md:text-base"
          >
            Thanishka
          </motion.p>
          <motion.h1
            key={slide.title}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.7 }}
            className="mt-4 font-display text-4xl leading-none tracking-[0.14em] md:text-6xl lg:text-7xl"
          >
            {slide.title}
          </motion.h1>
          <motion.p
            key={slide.subtitle}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28, duration: 0.7 }}
            className="mt-5 max-w-lg font-serif text-lg text-ivory/85 md:text-xl"
          >
            {slide.subtitle}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.38, duration: 0.6 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <ButtonLink
              href={slide.href}
              variant="gold"
              className="min-w-[160px]"
            >
              {slide.cta}
            </ButtonLink>
            <ButtonLink
              href="/shop"
              variant="secondary"
              className="min-w-[160px] border-ivory/40 text-ivory hover:border-ivory hover:bg-ivory hover:text-ink"
            >
              All Dresses
            </ButtonLink>
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {slides.map((s, i) => (
          <button
            key={`${s.title}-${i}`}
            aria-label={`Show slide ${i + 1}`}
            onClick={() => setIndex(i)}
            className={`h-1.5 transition-all ${
              i === index ? "w-8 bg-kasavu" : "w-1.5 bg-ivory/40"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
