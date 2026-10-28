"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { categories, filterProducts, type Size } from "@/lib/products";
import { ProductCard } from "@/components/product/ProductCard";
import { cn } from "@/lib/format";

const sizes: Size[] = ["XS", "S", "M", "L", "XL", "XXL"];
const occasions = ["Onam", "Vishu", "Eid", "Christmas", "Party", "Day"];
const PAGE_SIZE = 8;

export function ShopClient() {
  const params = useSearchParams();
  const router = useRouter();
  const category = params.get("category") ?? "all";
  const size = params.get("size") ?? "";
  const occasion = params.get("occasion") ?? "";
  const sort = params.get("sort") ?? "featured";
  const pageFromUrl = Number.parseInt(params.get("page") ?? "1", 10);
  const [openFilters, setOpenFilters] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const products = useMemo(
    () => filterProducts({ category, size, occasion, sort }),
    [category, size, occasion, sort],
  );

  const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
  const currentPage = Math.min(
    Math.max(1, Number.isFinite(pageFromUrl) ? pageFromUrl : 1),
    totalPages,
  );
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageProducts = products.slice(pageStart, pageStart + PAGE_SIZE);
  const showingFrom = products.length === 0 ? 0 : pageStart + 1;
  const showingTo = pageStart + pageProducts.length;

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (!value || value === "all") next.delete(key);
    else next.set(key, value);
    if (key !== "page") next.delete("page");
    router.push(`/shop?${next.toString()}`);
  };

  const setPage = (page: number) => {
    const next = new URLSearchParams(params.toString());
    if (page <= 1) next.delete("page");
    else next.set("page", String(page));
    router.push(`/shop?${next.toString()}`, { scroll: false });
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="container-page py-10 md:py-14">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-display text-[11px] tracking-[0.22em] text-kasavu-deep">
            Boutique
          </p>
          <h1 className="mt-2 font-display text-3xl tracking-[0.14em]">Shop</h1>
          <p className="mt-2 font-serif text-muted">
            {products.length} readymade pieces · sized XS–XXL
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            className="border border-line px-4 py-2 font-display text-[10px] tracking-[0.16em] md:hidden"
            onClick={() => setOpenFilters((v) => !v)}
          >
            Filters
          </button>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted">Sort</span>
            <select
              value={sort}
              onChange={(e) => setParam("sort", e.target.value)}
              className="border border-line bg-transparent px-3 py-2 outline-none"
            >
              <option value="featured">Featured</option>
              <option value="newest">Newest</option>
              <option value="price-asc">Price ↑</option>
              <option value="price-desc">Price ↓</option>
            </select>
          </label>
        </div>
      </div>

      <div className="grid items-start gap-8 md:grid-cols-[220px_1fr]">
        <aside
          className={cn(
            "space-y-8 border-line md:sticky md:top-28 md:block md:max-h-[calc(100svh-8rem)] md:overflow-y-auto md:border-0 md:pr-1",
            openFilters ? "block border-b pb-6" : "hidden",
          )}
        >
          <FilterGroup title="Category">
            <FilterChip
              active={category === "all"}
              onClick={() => setParam("category", "all")}
              label="All"
            />
            {categories.map((c) => (
              <FilterChip
                key={c.slug}
                active={category === c.slug}
                onClick={() => setParam("category", c.slug)}
                label={c.name}
              />
            ))}
          </FilterGroup>

          <FilterGroup title="Size">
            <FilterChip
              active={!size}
              onClick={() => setParam("size", "")}
              label="Any"
            />
            {sizes.map((s) => (
              <FilterChip
                key={s}
                active={size === s}
                onClick={() => setParam("size", s)}
                label={s}
              />
            ))}
          </FilterGroup>

          <FilterGroup title="Occasion">
            <FilterChip
              active={!occasion}
              onClick={() => setParam("occasion", "")}
              label="Any"
            />
            {occasions.map((o) => (
              <FilterChip
                key={o}
                active={occasion === o}
                onClick={() => setParam("occasion", o)}
                label={o}
              />
            ))}
          </FilterGroup>
        </aside>

        <div ref={resultsRef} className="min-w-0 scroll-mt-28">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
            {pageProducts.map((p, i) => (
              <ProductCard
                key={p.id}
                product={p}
                priority={currentPage === 1 && i < 4}
              />
            ))}
            {products.length === 0 && (
              <p className="col-span-full py-20 text-center font-serif text-xl text-muted">
                No dresses match these filters.
              </p>
            )}
          </div>

          {products.length > 0 && (
            <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-line pt-6 sm:flex-row">
              <p className="font-serif text-sm text-muted">
                Showing {showingFrom}–{showingTo} of {products.length}
              </p>
              {totalPages > 1 && (
                <nav
                  aria-label="Shop pagination"
                  className="flex flex-wrap items-center gap-2"
                >
                  <PaginationButton
                    disabled={currentPage <= 1}
                    onClick={() => setPage(currentPage - 1)}
                    label="Prev"
                  />
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <PaginationButton
                        key={page}
                        active={page === currentPage}
                        onClick={() => setPage(page)}
                        label={String(page)}
                        ariaCurrent={page === currentPage ? "page" : undefined}
                      />
                    ),
                  )}
                  <PaginationButton
                    disabled={currentPage >= totalPages}
                    onClick={() => setPage(currentPage + 1)}
                    label="Next"
                  />
                </nav>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="mb-3 font-display text-[11px] tracking-[0.18em]">{title}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "border px-3 py-1.5 font-display text-[10px] tracking-[0.12em] transition",
        active
          ? "border-charcoal bg-charcoal text-ivory"
          : "border-line text-muted hover:border-charcoal hover:text-charcoal",
      )}
    >
      {label}
    </button>
  );
}

function PaginationButton({
  label,
  onClick,
  disabled,
  active,
  ariaCurrent,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  ariaCurrent?: "page";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-current={ariaCurrent}
      className={cn(
        "min-w-10 border px-3 py-2 font-display text-[10px] tracking-[0.14em] transition disabled:cursor-not-allowed disabled:opacity-35",
        active
          ? "border-charcoal bg-charcoal text-ivory"
          : "border-line text-muted hover:border-charcoal hover:text-charcoal",
      )}
    >
      {label}
    </button>
  );
}
