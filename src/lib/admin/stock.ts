import { prisma } from "@/lib/db";
import { asSizeMap, type SizeMap } from "@/lib/admin/types";

export const SIZE_KEYS = ["XS", "S", "M", "L", "XL", "XXL"] as const;
export type SizeKey = (typeof SIZE_KEYS)[number];

export async function applyStockChange(opts: {
  productId: string;
  size: SizeKey;
  mode: "set" | "adjust";
  quantity?: number;
  delta?: number;
  note?: string;
  source?: string;
  adminId?: string | null;
}) {
  const product = await prisma.product.findUnique({
    where: { id: opts.productId },
  });

  if (!product) {
    throw new Error(`Product ${opts.productId} not found`);
  }

  const sizes = asSizeMap(product.sizes);
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

  await prisma.$transaction([
    prisma.product.update({
      where: { id: product.id },
      data: { sizes },
    }),
    prisma.stockMovement.create({
      data: {
        productId: product.id,
        size: opts.size,
        delta,
        quantityAfter: next,
        note: opts.note ?? null,
        source: opts.source ?? "manual",
        adminId: opts.adminId ?? null,
      },
    }),
  ]);

  return {
    productId: product.id,
    size: opts.size,
    previous: current,
    quantity: next,
    delta,
  };
}

export function totalUnits(sizes: SizeMap | Record<string, number>) {
  return Object.values(sizes).reduce((a, b) => a + Number(b || 0), 0);
}
