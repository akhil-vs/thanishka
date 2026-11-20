"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Heart, Play } from "lucide-react";
import { isAppHostedImageRef } from "@/lib/image-ref";
import type { Product, Size } from "@/lib/products";
import { sizeChartForProduct } from "@/lib/size-charts";
import { formatINR, cn } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/store/cart";
import { useWishlist } from "@/store/wishlist";
import { useUI } from "@/store/ui";
import { ProductCard } from "@/components/product/ProductCard";
import { ShareProductButton } from "@/components/product/ShareProductButton";
import { VirtualTryOn } from "@/components/product/VirtualTryOn";

const sizeOrder: Size[] = ["XS", "S", "M", "L", "XL", "XXL"];
const SWIPE_THRESHOLD = 48;

type GallerySlide =
  | { kind: "video"; src: string }
  | { kind: "image"; src: string };

function gallerySlides(
  product: Pick<Product, "videoUrl" | "images">,
): GallerySlide[] {
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

function GalleryVideo({ src, label }: { src: string; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(true);

  return (
    <>
      <video
        ref={ref}
        src={src}
        controls
        playsInline
        preload="metadata"
        className="absolute inset-0 h-full w-full bg-charcoal object-contain"
        aria-label={label}
        onPlay={() => setPaused(false)}
        onPause={() => setPaused(true)}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        Your browser does not support the video tag.
      </video>
      {paused ? (
        <button
          type="button"
          aria-label="Play video"
          onClick={() => {
            void ref.current?.play();
          }}
          className="absolute left-1/2 top-1/2 z-20 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center border border-line bg-ivory/90 text-charcoal"
        >
          <Play size={22} fill="currentColor" aria-hidden />
        </button>
      ) : null}
    </>
  );
}

export function ProductDetail({
  product,
  related,
}: {
  product: Product;
  related: Product[];
}) {
  const [active, setActive] = useState(0);
  const [size, setSize] = useState<Size | null>(null);
  const [pin, setPin] = useState("");
  const [pinMsg, setPinMsg] = useState("");
  const [showChart, setShowChart] = useState(false);
  const addItem = useCart((s) => s.addItem);
  const openCart = useUI((s) => s.openCart);
  const toggle = useWishlist((s) => s.toggle);
  const wished = useWishlist((s) => s.ids.includes(product.id));
  const chart = sizeChartForProduct(product);
  const slides = useMemo(() => gallerySlides(product), [product]);
  const slideCount = slides.length;
  const hasMultiple = slideCount > 1;
  const activeIndex =
    slideCount === 0 ? 0 : Math.min(active, slideCount - 1);
  const activeSlide = slides[activeIndex];
  const touchStartX = useRef<number | null>(null);

  const stock = size ? product.sizes[size] : null;
  const lowStock = stock !== null && stock > 0 && stock <= 2;

  const canAdd = useMemo(
    () => Boolean(size && stock && stock > 0),
    [size, stock],
  );

  function goTo(index: number) {
    if (slideCount === 0) return;
    setActive(((index % slideCount) + slideCount) % slideCount);
  }

  function showPrev() {
    goTo(activeIndex - 1);
  }

  function showNext() {
    goTo(activeIndex + 1);
  }

  return (
    <div className="pb-28 md:pb-0">
      <div className="container-page grid gap-8 py-8 md:grid-cols-2 md:gap-12 md:py-12">
        <div>
          <div
            className="relative aspect-[3/4] overflow-hidden bg-sand outline-none"
            tabIndex={hasMultiple ? 0 : undefined}
            role={hasMultiple ? "region" : undefined}
            aria-roledescription={hasMultiple ? "carousel" : undefined}
            aria-label={
              hasMultiple
                ? `${product.name} gallery, ${
                    activeSlide?.kind === "video"
                      ? "video"
                      : `image ${imageOrdinal(slides, activeIndex)}`
                  }, ${activeIndex + 1} of ${slideCount}`
                : undefined
            }
            onKeyDown={(e) => {
              if (!hasMultiple) return;
              if (e.key === "ArrowLeft") {
                e.preventDefault();
                showPrev();
              } else if (e.key === "ArrowRight") {
                e.preventDefault();
                showNext();
              }
            }}
            onTouchStart={(e) => {
              if (!hasMultiple) return;
              touchStartX.current = e.changedTouches[0]?.clientX ?? null;
            }}
            onTouchEnd={(e) => {
              if (!hasMultiple || touchStartX.current == null) return;
              const endX = e.changedTouches[0]?.clientX;
              if (endX == null) return;
              const delta = endX - touchStartX.current;
              touchStartX.current = null;
              if (Math.abs(delta) < SWIPE_THRESHOLD) return;
              if (delta > 0) showPrev();
              else showNext();
            }}
          >
            {activeSlide?.kind === "video" ? (
              <GalleryVideo
                key={activeSlide.src}
                src={activeSlide.src}
                label={`${product.name} video`}
              />
            ) : activeSlide?.kind === "image" ? (
              <Image
                src={activeSlide.src}
                alt={`${product.name} — image ${imageOrdinal(slides, activeIndex)} of ${product.images.length}`}
                fill
                preload={activeIndex === 0}
                unoptimized={isAppHostedImageRef(activeSlide.src)}
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition duration-500 hover:scale-[1.03]"
                draggable={false}
              />
            ) : null}
            {hasMultiple && (
              <>
                <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-between px-2 md:px-3">
                  <button
                    type="button"
                    onClick={showPrev}
                    aria-label="Previous slide"
                    className="pointer-events-auto flex h-10 w-10 items-center justify-center border border-line bg-ivory/90 text-charcoal transition hover:bg-ivory"
                  >
                    <ChevronLeft size={20} strokeWidth={1.5} />
                  </button>
                  <button
                    type="button"
                    onClick={showNext}
                    aria-label="Next slide"
                    className="pointer-events-auto flex h-10 w-10 items-center justify-center border border-line bg-ivory/90 text-charcoal transition hover:bg-ivory"
                  >
                    <ChevronRight size={20} strokeWidth={1.5} />
                  </button>
                </div>
                <p
                  className={cn(
                    "pointer-events-none absolute right-3 z-10 bg-ivory/90 px-2 py-1 font-display text-[10px] tracking-[0.14em] text-charcoal",
                    activeSlide?.kind === "video" ? "top-3" : "bottom-3",
                  )}
                >
                  {activeSlide?.kind === "video" ? "Video · " : ""}
                  {activeIndex + 1} / {slideCount}
                </p>
              </>
            )}
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {slides.map((slide, i) => (
              <button
                key={`${slide.kind}-${i}`}
                type="button"
                onClick={() => setActive(i)}
                aria-label={
                  slide.kind === "video"
                    ? "Show video"
                    : `Show image ${imageOrdinal(slides, i)}`
                }
                aria-current={i === activeIndex ? "true" : undefined}
                className={cn(
                  "relative h-20 w-16 shrink-0 overflow-hidden border",
                  i === activeIndex ? "border-charcoal" : "border-transparent",
                )}
              >
                {slide.kind === "video" ? (
                  <>
                    <video
                      src={slide.src}
                      muted
                      playsInline
                      preload="metadata"
                      tabIndex={-1}
                      aria-hidden
                      className="pointer-events-none absolute inset-0 h-full w-full object-cover"
                    />
                    <span className="absolute inset-0 flex items-center justify-center bg-charcoal/40">
                      <Play
                        size={16}
                        className="text-ivory"
                        fill="currentColor"
                        aria-hidden
                      />
                    </span>
                  </>
                ) : (
                  <Image
                    src={slide.src}
                    alt=""
                    fill
                    unoptimized={isAppHostedImageRef(slide.src)}
                    className="object-cover"
                    sizes="64px"
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="font-display text-[11px] tracking-[0.2em] text-muted">
            {product.category}
          </p>
          <h1 className="mt-2 font-display text-2xl tracking-[0.12em] md:text-3xl">
            {product.name}
          </h1>
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-lg">{formatINR(product.price)}</span>
            {product.compareAt && (
              <span className="text-muted line-through">
                {formatINR(product.compareAt)}
              </span>
            )}
            {product.isNew && (
              <span className="bg-mist px-2 py-1 font-display text-[9px] tracking-[0.14em]">
                New
              </span>
            )}
          </div>

          <p className="mt-6 font-serif text-lg leading-relaxed text-muted">
            {product.description}
          </p>

          <div className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-display text-[11px] tracking-[0.18em]">Size</p>
              <button
                onClick={() => setShowChart((s) => !s)}
                className="text-sm text-muted underline-offset-2 hover:underline"
              >
                Size chart
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {sizeOrder.map((s) => {
                const qty = product.sizes[s];
                const disabled = qty <= 0;
                return (
                  <button
                    key={s}
                    disabled={disabled}
                    onClick={() => setSize(s)}
                    className={cn(
                      "min-w-12 border px-3 py-2 font-display text-[11px] tracking-[0.12em] transition",
                      size === s
                        ? "border-charcoal bg-charcoal text-ivory"
                        : "border-line hover:border-charcoal",
                      disabled && "cursor-not-allowed opacity-30 line-through",
                    )}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
            {lowStock && (
              <p className="mt-3 text-sm text-sale">Only {stock} left in {size}</p>
            )}
            {showChart && (
              <div className="mt-4 overflow-x-auto border border-line">
                <table className="w-full text-left text-sm">
                  <thead className="bg-mist font-display text-[10px] tracking-[0.14em]">
                    <tr>
                      {chart.columns.map((col) => (
                        <th key={col} className="px-3 py-2">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="text-muted">
                    {chart.rows.map((row) => (
                      <tr key={row[0]} className="border-t border-line">
                        {row.map((cell, i) => (
                          <td key={`${row[0]}-${i}`} className="px-3 py-2">
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

          <div className="mt-8 hidden gap-3 md:flex">
            <Button
              className="flex-1"
              disabled={!canAdd}
              onClick={() => {
                if (!size) return;
                addItem(product, size);
                openCart();
              }}
            >
              Add to Bag
            </Button>
            <ShareProductButton name={product.name} price={product.price} />
            <button
              aria-label="Wishlist"
              onClick={() => toggle(product.id)}
              className={cn(
                "flex h-12 w-12 items-center justify-center border border-line",
                wished && "text-sale",
              )}
            >
              <Heart size={18} fill={wished ? "currentColor" : "none"} strokeWidth={1.5} />
            </button>
          </div>

          <VirtualTryOn product={product} />

          <dl className="mt-10 space-y-4 border-t border-line pt-6 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Fabric</dt>
              <dd>{product.fabric}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Care</dt>
              <dd className="text-right">{product.care}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Occasion</dt>
              <dd>{product.occasion.join(" · ")}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Colours</dt>
              <dd>{product.colors.join(", ")}</dd>
            </div>
          </dl>

          <form
            className="mt-8 border border-line p-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!/^\d{6}$/.test(pin)) {
                setPinMsg("Enter a valid 6-digit PIN code");
                return;
              }
              setPinMsg(
                "We ship across India. Trivandrum PIN codes are usually 1–2 days after packing; most other cities 3–6 days. Exact ETA is confirmed when your order is handed to the courier.",
              );
            }}
          >
            <p className="font-display text-[11px] tracking-[0.16em]">
              Delivery check
            </p>
            <p className="mt-1 text-xs text-muted">
              Free shipping above ₹1,999 · flat ₹99 below that within India.
            </p>
            <div className="mt-3 flex gap-2">
              <input
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="PIN code"
                inputMode="numeric"
                maxLength={6}
                className="flex-1 border border-line bg-transparent px-3 py-2 text-sm outline-none focus:border-kasavu"
              />
              <Button type="submit" variant="secondary" className="px-4">
                Check
              </Button>
            </div>
            {pinMsg && <p className="mt-2 text-sm text-muted">{pinMsg}</p>}
          </form>
        </div>
      </div>

      {related.length > 0 && (
        <section className="container-page border-t border-line py-16">
          <h2 className="mb-8 font-display text-xl tracking-[0.16em]">
            You may also like
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <div className="fixed inset-x-0 bottom-14 z-30 border-t border-line bg-ivory/95 p-3 backdrop-blur md:hidden">
        <div className="flex gap-2">
          <Button
            className="flex-1"
            disabled={!canAdd}
            onClick={() => {
              if (!size) return;
              addItem(product, size);
              openCart();
            }}
          >
            {size ? "Add to Bag" : "Select a size"}
          </Button>
          <ShareProductButton name={product.name} price={product.price} />
          <button
            type="button"
            onClick={() => toggle(product.id)}
            className="flex h-12 w-12 items-center justify-center border border-line"
            aria-label="Wishlist"
          >
            <Heart size={18} fill={wished ? "currentColor" : "none"} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
