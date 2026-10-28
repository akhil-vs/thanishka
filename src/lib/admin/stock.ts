import { eq } from "drizzle-orm";
import type { AppDb } from "@/db";
import { products, stockMovements } from "@/db/schema";

export const SIZE_KEYS = ["XS", "S", "M", "L", "XL", "XXL"] as const;
export type SizeKey = (typeof SIZE_KEYS)[number];

function movementId() {
  return `stk_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

export function applyStockChange(
  db: AppDb,
  opts: {
    productId: string;
    size: SizeKey;
    mode: "set" | "adjust";
    quantity?: number;
    delta?: number;
    note?: string;
    source?: string;
    adminId?: string | null;
  },
) {
  const product = db
    .select()
    .from(products)
    .where(eq(products.id, opts.productId))
    .get();

  if (!product) {
    throw new Error(`Product ${opts.productId} not found`);
  }

  const sizes = { ...product.sizes } as Record<SizeKey, number>;
  const current = sizes[opts.size] ?? 0;

  let next = current;
  if (opts.mode === "set") {
    if (opts.quantity == null) throw new Error("quantity required for set mode");
    next = opts.quantity;
  } else {
    if (opts.delta == null) throw new Error("delta required for adjust mode");
    next = current + opts.delta;
  }

  if (next < 0) {
    throw new Error(
      `Stock for ${product.name} / ${opts.size} cannot go below 0`,
    );
  }

  const delta = next - current;
  sizes[opts.size] = next;

  db.update(products)
    .set({
      sizes,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(products.id, product.id))
    .run();

  db.insert(stockMovements)
    .values({
      id: movementId(),
      productId: product.id,
      size: opts.size,
      delta,
      quantityAfter: next,
      note: opts.note ?? null,
      source: opts.source ?? "manual",
      adminId: opts.adminId ?? null,
    })
    .run();

  return {
    productId: product.id,
    size: opts.size,
    previous: current,
    quantity: next,
    delta,
  };
}

export function totalUnits(sizes: Record<string, number>) {
  return Object.values(sizes).reduce((a, b) => a + b, 0);
}
