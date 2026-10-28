"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { categories } from "@/lib/products";
import { cn } from "@/lib/format";
import { useCart } from "@/store/cart";
import { useWishlist } from "@/store/wishlist";
import { useUI } from "@/store/ui";

const nav = [
  { href: "/shop?category=new-in", label: "New In" },
  { href: "/shop", label: "Shop" },
  { href: "/shop?category=festive", label: "Festive" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Visit" },
];

export function Header() {
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mega, setMega] = useState(false);
  const { openCart, openMobileNav, mobileNavOpen, closeMobileNav } = useUI();
  const count = useCart((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  const wishCount = useWishlist((s) => s.ids.length);

  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
      setHidden(y > last && y > 120);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileNavOpen]);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 border-b transition-transform duration-500",
          scrolled
            ? "border-line bg-ivory/90 backdrop-blur-md"
            : "border-transparent bg-ivory/70 backdrop-blur-sm",
          hidden && !mobileNavOpen ? "-translate-y-full" : "translate-y-0",
        )}
      >
        <div className="container-page relative flex h-20 items-center justify-between gap-4 md:h-24">
          <div className="flex items-center gap-3 md:hidden">
            <button
              aria-label="Open menu"
              onClick={openMobileNav}
              className="p-2 -ml-2"
            >
              <Menu size={20} strokeWidth={1.5} />
            </button>
            <Link href="/shop" aria-label="Search shop" className="p-2">
              <Search size={18} strokeWidth={1.5} />
            </Link>
          </div>

          <nav className="hidden items-center gap-7 md:flex">
            {nav.map((item) =>
              item.label === "Shop" ? (
                <button
                  key={item.href}
                  className="font-display text-[11px] tracking-[0.2em] text-charcoal/80 transition hover:text-charcoal"
                  onMouseEnter={() => setMega(true)}
                  onFocus={() => setMega(true)}
                >
                  {item.label}
                </button>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className="font-display text-[11px] tracking-[0.2em] text-charcoal/80 transition hover:text-charcoal"
                >
                  {item.label}
                </Link>
              ),
            )}
          </nav>

          <Link
            href="/"
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            aria-label="Thanishka home"
          >
            <Image
              src="/thanishka-logo.png"
              alt="Thanishka — elegance, tailored to you"
              width={465}
              height={320}
              priority
              unoptimized
              className="h-14 w-auto object-contain [filter:drop-shadow(0_1px_1px_rgba(28,27,25,0.25))_drop-shadow(0_3px_6px_rgba(28,27,25,0.28))] md:h-[4.5rem]"
            />
          </Link>

          <div className="flex items-center gap-1 md:gap-2">
            <Link href="/account" className="hidden p-2 md:inline-flex" aria-label="Account">
              <User size={18} strokeWidth={1.5} />
            </Link>
            <Link href="/wishlist" className="relative p-2" aria-label="Wishlist">
              <Heart size={18} strokeWidth={1.5} />
              {wishCount > 0 && (
                <span className="absolute top-1 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-kasavu px-1 font-display text-[9px] text-ink">
                  {wishCount}
                </span>
              )}
            </Link>
            <button
              onClick={openCart}
              className="relative p-2"
              aria-label="Open cart"
            >
              <ShoppingBag size={18} strokeWidth={1.5} />
              {count > 0 && (
                <span className="absolute top-1 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-charcoal px-1 font-display text-[9px] text-ivory">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>

        <div
          className={cn(
            "absolute inset-x-0 top-full hidden overflow-hidden border-b border-line bg-ivory transition-all duration-300 md:block",
            mega ? "max-h-72 opacity-100" : "pointer-events-none max-h-0 opacity-0",
          )}
          onMouseLeave={() => setMega(false)}
        >
          <div className="container-page grid grid-cols-4 gap-8 py-8">
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={`/shop?category=${c.slug}`}
                className="group"
                onClick={() => setMega(false)}
              >
                <p className="font-display text-[11px] tracking-[0.18em] text-charcoal group-hover:text-kasavu-deep">
                  {c.name}
                </p>
                <p className="mt-2 font-serif text-sm text-muted">
                  Shop the edit
                </p>
              </Link>
            ))}
          </div>
        </div>
      </header>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 bg-ivory md:hidden">
          <div className="flex h-16 items-center justify-between px-4">
            <span className="font-display tracking-[0.3em]">Menu</span>
            <button aria-label="Close menu" onClick={closeMobileNav} className="p-2">
              <X size={22} strokeWidth={1.5} />
            </button>
          </div>
          <nav className="flex flex-col gap-1 px-6 pt-4">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobileNav}
                className="border-b border-line py-4 font-display text-sm tracking-[0.2em]"
              >
                {item.label}
              </Link>
            ))}
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={`/shop?category=${c.slug}`}
                onClick={closeMobileNav}
                className="py-3 font-serif text-lg text-muted"
              >
                {c.name}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
