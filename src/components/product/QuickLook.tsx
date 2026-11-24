"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Heart,
  Minus,
  Play,
  Plus,
  X,
} from "lucide-react";
import { isAppHostedImageRef } from "@/lib/image-ref";
import type { Product, Size } from "@/lib/products";
import { sizeChartForProduct } from "@/lib/size-charts";
import { cn, formatINR } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/store/cart";
import { useWishlist } from "@/store/wishlist";
import { useUI } from "@/store/ui";

const sizeOrder: Size[] = ["XS", "S", "M", "L", "XL", "XXL"];
const SWIPE_THRESHOLD = 48;

const swatches: Record<string, string> = {
  crimson: "#8c2f39",
  gold: "#c4a46a",
  charcoal: "#3a3835",
  black: "#161514",
  sand: "#d9cbb8",
  olive: "#6b7043",
  emerald: "#1a3c34",
  ivory: "#f4efe6",
  indigo: "#2c3e6b",
  cream: "#f3e6d0",
  yellow: "#e3c15a",
  white: "#f7f7f5",
  champagne: "#e7d3b0",
  sage: "#9aaa90",
  terracotta: "#c46a4a",
  wine: "#6e2433",
};

type GallerySlide =
  | { kind: "video"; src: string }
  | { kind: "image"; src: string };

function slidesFor(product: Product): GallerySlide[] {
  const slides: GallerySlide[] = [];
  if (product.videoUrl) slides.push({ kind: "video", src: product.videoUrl });
  for (const src of product.images) slides.push({ kind: "image", src });
  return slides;
}

function imageOrdinal(slides: GallerySlide[], index: number) {
  let count = 0;
  for (let i = 0; i <= index && i < slides.length; i++) {
    if (slides[i]?.kind === "image") count += 1;
  }
  return count;
}

function percentOff(price: number, compareAt?: number) {
  if (!compareAt || compareAt <= price) return null;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function QuickLook({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const touchStartX = useRef<number | null>(null);
  const [active, setActive] = useState(0);
  const [size, setSize] = useState<Size | null>(null);
  const [qty, setQty] = useState(1);
  const [showChart, setShowChart] = useState(false);
  const addItem = useCart((s) => s.addItem);
  const openCart = useUI((s) => s.openCart);
  const toggleWish = useWishlist((s) => s.toggle);
  const wished = useWishlist((s) => s.ids.includes(product.id));

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const slides = slidesFor(product);
  const slideCount = slides.length;
  const activeIndex = slideCount === 0 ? 0 : Math.min(active, slideCount - 1);
  const activeSlide = slides[activeIndex];
  const chart = sizeChartForProduct(product);
  const off = percentOff(product.price, product.compareAt);
  const stock = size ? (product.sizes[size] ?? 0) : 0;
  const maxQty = size ? Math.max(stock, 1) : 8;
  const canAdd = Boolean(size && stock > 0);
  const lowStock = Boolean(size && stock > 0 && stock <= 2);
  const inStockCount = sizeOrder.filter((s) => (product.sizes[s] ?? 0) > 0).length;

  function goTo(index: number) {
    if (slideCount === 0) return;
    setActive(((index % slideCount) + slideCount) % slideCount);
  }

  function pickSize(next: Size) {
    const available = product.sizes[next] ?? 0;
    if (available <= 0) return;
    setSize(next);
    setQty((current) => Math.min(current, available));
  }

  function addToBag() {
    if (!size || stock <= 0) return;
    addItem(product, size, Math.min(qty, stock));
    onCloseRef.current();
    openCart();
  }

  useEffect(() => {
    const dialog = dialogRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const getFocusable = () => {
      if (!dialog) return [];
      return Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector)).filter(
        (el) => !el.hasAttribute("disabled") && el.getClientRects().length > 0,
      );
    };

    const initial = getFocusable();
    (initial[0] ?? dialog)?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        const target = event.target as Node | null;
        const gallery = dialog?.querySelector("[data-quick-look-gallery]");
        if (gallery && target && gallery.contains(target)) {
          event.preventDefault();
          if (slideCount <= 1) return;
          const delta = event.key === "ArrowRight" ? 1 : -1;
          setActive(
            (current) => ((current + delta) % slideCount + slideCount) % slideCount,
          );
        }
        return;
      }
      if (event.key !== "Tab" || !dialog) return;
      const items = getFocusable();
      if (items.length === 0) {
        event.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const current = document.activeElement;
      if (event.shiftKey && (current === first || !dialog.contains(current))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (current === last || !dialog.contains(current))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [slideCount]);

  const addLabel =
    inStockCount === 0
      ? "Sold out"
      : !size
        ? "Select a size"
        : `Add to bag · ${formatINR(product.price * Math.min(qty, stock))}`;

  const dialog = (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/55 sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="animate-dialog-in relative flex h-[94dvh] w-full max-w-5xl flex-col overflow-hidden bg-ivory shadow-2xl outline-none md:h-[min(88dvh,840px)] md:flex-row"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close quick look"
          className="absolute top-3 right-3 z-20 flex h-9 w-9 items-center justify-center bg-ivory/95 text-charcoal"
        >
          <X size={18} strokeWidth={1.5} />
        </button>

        <div
          className="relative h-[30vh] min-h-[210px] shrink-0 bg-sand outline-none md:h-full md:min-h-0 md:w-[48%]"
          data-quick-look-gallery
          tabIndex={slideCount > 1 ? 0 : undefined}
          onTouchStart={(event) => {
              if (slideCount < 2) return;
              touchStartX.current = event.changedTouches[0]?.clientX ?? null;
            }}
            onTouchEnd={(event) => {
              const startX = touchStartX.current;
              touchStartX.current = null;
              if (slideCount < 2 || startX == null) return;
              const endX = event.changedTouches[0]?.clientX;
              if (endX == null) return;
              const delta = endX - startX;
              if (Math.abs(delta) < SWIPE_THRESHOLD) return;
              goTo(activeIndex + (delta > 0 ? -1 : 1));
            }}
          >
            {activeSlide?.kind === "video" ? (
              <video
                key={activeSlide.src}
                src={activeSlide.src}
                controls
                playsInline
                preload="metadata"
                className="absolute inset-0 h-full w-full bg-charcoal object-contain"
                aria-label={`${product.name} video`}
              />
            ) : activeSlide?.kind === "image" ? (
              <Image
                src={activeSlide.src}
                alt={`${product.name}, image ${imageOrdinal(slides, activeIndex)} of ${product.images.length}`}
                fill
                priority
                unoptimized={isAppHostedImageRef(activeSlide.src)}
                sizes="(max-width: 768px) 100vw, 480px"
                className="object-cover"
              />
            ) : null}

            {slideCount > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous image"
                  onClick={() => goTo(activeIndex - 1)}
                  className="absolute top-1/2 left-3 flex h-10 w-10 -translate-y-1/2 items-center justify-center border border-line bg-ivory/90"
                >
                  <ChevronLeft size={18} strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  aria-label="Next image"
                  onClick={() => goTo(activeIndex + 1)}
                  className="absolute top-1/2 right-3 flex h-10 w-10 -translate-y-1/2 items-center justify-center border border-line bg-ivory/90"
                >
                  <ChevronRight size={18} strokeWidth={1.5} />
                </button>
                <p className="pointer-events-none absolute top-3 left-3 bg-ivory/90 px-2 py-1 font-display text-[10px] tracking-[0.14em]">
                  {activeSlide?.kind === "video" ? "Video · " : ""}
                  {activeIndex + 1} / {slideCount}
                </p>
              </>
            )}

          {slideCount > 1 && (
            <div className="absolute inset-x-3 bottom-3 flex gap-2 overflow-x-auto">
              {slides.map((slide, index) => (
                <button
                  key={`${slide.kind}-${index}`}
                  type="button"
                  onClick={() => setActive(index)}
                  aria-label={
                    slide.kind === "video"
                      ? "Show video"
                      : `Show image ${imageOrdinal(slides, index)}`
                  }
                  aria-current={index === activeIndex ? "true" : undefined}
                  className={cn(
                    "relative h-16 w-12 shrink-0 overflow-hidden border",
                    index === activeIndex ? "border-charcoal" : "border-ivory",
                  )}
                >
                  {slide.kind === "video" ? (
                    <span className="absolute inset-0 flex items-center justify-center bg-charcoal text-ivory">
                      <Play size={14} fill="currentColor" aria-hidden />
                    </span>
                  ) : (
                    <Image
                      src={slide.src}
                      alt=""
                      fill
                      unoptimized={isAppHostedImageRef(slide.src)}
                      sizes="48px"
                      className="object-cover"
                    />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-5 pb-4 md:px-7 md:pt-7">
            <p className="pr-10 font-display text-[11px] tracking-[0.2em] text-muted">
              {product.category}
            </p>
            <h2
              id={titleId}
              className="mt-2 pr-8 font-display text-xl tracking-[0.12em] md:text-2xl"
            >
              {product.name}
            </h2>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-lg">{formatINR(product.price)}</span>
              {product.compareAt && product.compareAt > product.price && (
                <span className="text-muted line-through">
                  {formatINR(product.compareAt)}
                </span>
              )}
              {off != null && (
                <span className="bg-sale px-1.5 py-1 font-display text-[10px] tracking-[0.12em] text-ivory">
                  -{off}%
                </span>
              )}
              {product.isNew && (
                <span className="bg-mist px-1.5 py-1 font-display text-[10px] tracking-[0.12em]">
                  New
                </span>
              )}
            </div>

            <p className="mt-3 text-sm text-muted">
              Free shipping above ₹1,999 · ₹99 below that, across India.
            </p>

            <div className="mt-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="font-display text-[11px] tracking-[0.18em]">Size</p>
                <button
                  type="button"
                  onClick={() => setShowChart((open) => !open)}
                  className="text-sm text-muted underline-offset-2 hover:underline"
                  aria-expanded={showChart}
                >
                  Size chart
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {sizeOrder.map((option) => {
                  const available = product.sizes[option] ?? 0;
                  const disabled = available <= 0;
                  return (
                    <button
                      key={option}
                      type="button"
                      disabled={disabled}
                      aria-pressed={size === option}
                      onClick={() => pickSize(option)}
                      className={cn(
                        "min-w-12 border px-3 py-2 font-display text-[11px] tracking-[0.12em] transition",
                        size === option
                          ? "border-charcoal bg-charcoal text-ivory"
                          : "border-line hover:border-charcoal",
                        disabled && "cursor-not-allowed opacity-30 line-through",
                      )}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-sm text-muted" aria-live="polite">
                {inStockCount === 0
                  ? "Sold out"
                  : !size
                    ? "Choose a size to add this piece."
                    : lowStock
                      ? `Only ${stock} left in ${size}`
                      : `${stock} available in ${size}`}
              </p>
              {showChart && (
                <div className="mt-4 overflow-x-auto border border-line">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-mist font-display text-[10px] tracking-[0.14em]">
                      <tr>
                        {chart.columns.map((col) => (
                          <th key={col} className="px-3 py-2 font-normal">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="text-muted">
                      {chart.rows.map((row) => (
                        <tr key={row[0]} className="border-t border-line">
                          {row.map((cell, index) => (
                            <td key={`${row[0]}-${index}`} className="px-3 py-2">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="border-t border-line px-3 py-2 text-xs text-muted">
                    {chart.note}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6">
              <p className="font-display text-[11px] tracking-[0.18em]">Quantity</p>
              <div
                className="mt-2 inline-flex items-center border border-line"
                role="group"
                aria-label="Quantity"
              >
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  disabled={qty <= 1}
                  onClick={() => setQty((current) => Math.max(1, current - 1))}
                  className="flex h-10 w-10 items-center justify-center disabled:opacity-30"
                >
                  <Minus size={14} />
                </button>
                <span className="min-w-8 text-center text-sm" aria-live="polite">
                  {qty}
                </span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  disabled={qty >= maxQty || (size != null && stock <= 0)}
                  onClick={() => setQty((current) => Math.min(maxQty, current + 1))}
                  className="flex h-10 w-10 items-center justify-center disabled:opacity-30"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {product.colors.length > 0 && (
              <div className="mt-6">
                <p className="font-display text-[11px] tracking-[0.18em]">Colours</p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {product.colors.map((color) => {
                    const swatch = swatches[color.toLowerCase()];
                    return (
                      <li
                        key={color}
                        className="inline-flex items-center gap-2 border border-line px-2 py-1 text-sm"
                      >
                        <span
                          aria-hidden
                          className="h-3.5 w-3.5 border border-line"
                          style={{ backgroundColor: swatch ?? "#e8e0d4" }}
                        />
                        {color}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            <p className="mt-5 font-serif text-base leading-relaxed text-muted">
              {product.description}
            </p>

            <dl className="mt-6 space-y-2 border-t border-line pt-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Fabric</dt>
                <dd className="text-right">{product.fabric}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Occasion</dt>
                <dd className="text-right">{product.occasion.join(" · ")}</dd>
              </div>
            </dl>

            <Link
              href={`/product/${product.slug}`}
              onClick={onClose}
              className="mt-5 inline-flex items-center gap-1 font-display text-[11px] tracking-[0.16em] text-kasavu-deep underline-offset-4 hover:underline"
            >
              View full details
              <ArrowRight size={14} strokeWidth={1.5} />
            </Link>
          </div>

          <div className="flex shrink-0 gap-2 border-t border-line bg-ivory p-4">
            <Button
              type="button"
              className="flex-1"
              disabled={!canAdd}
              onClick={addToBag}
            >
              {addLabel}
            </Button>
            <button
              type="button"
              aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
              aria-pressed={wished}
              onClick={() => toggleWish(product.id)}
              className={cn(
                "flex h-12 w-12 items-center justify-center border border-line",
                wished && "text-sale",
              )}
            >
              <Heart
                size={18}
                strokeWidth={1.5}
                fill={wished ? "currentColor" : "none"}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
}
