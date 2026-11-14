import { cacheLife, cacheTag } from "next/cache";
import type { Product as DbProduct } from "@prisma/client";
import { asSizeMap, asStringArray } from "@/lib/admin/types";
import { prisma } from "@/lib/db";
import {
  getProduct as getStaticProduct,
  getRelated as getStaticRelated,
  products as staticProducts,
  type Product,
  type Size,
} from "@/lib/products";

function ensureImagePair(images: string[]): [string, string, ...string[]] {
  if (images.length >= 2) {
    return images as [string, string, ...string[]];
  }
  const primary = images[0] ?? "/thanishka-mark.png";
  return [primary, primary];
}

export function mapDbProduct(row: DbProduct): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    categorySlug: row.categorySlug,
    price: row.price,
    compareAt: row.compareAt ?? undefined,
    colors: asStringArray(row.colors),
    fabric: row.fabric,
    occasion: asStringArray(row.occasion),
    description: row.description,
    care: row.care,
    images: ensureImagePair(asStringArray(row.images)),
    sizes: asSizeMap(row.sizes) as Record<Size, number>,
    isNew: row.isNew,
    onSale: row.onSale,
    featured: row.featured,
  };
}

export async function listCatalogProducts(): Promise<Product[]> {
  "use cache";
  cacheTag("catalog");
  cacheLife("minutes");

  try {
    const rows = await prisma.product.findMany({
      where: { active: true },
      orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
    });
    if (rows.length === 0) return staticProducts;
    return rows.map(mapDbProduct);
  } catch (err) {
    console.error("[catalog] list failed, using static fallback", err);
    return staticProducts;
  }
}

export async function getCatalogProduct(
  slug: string,
): Promise<Product | undefined> {
  "use cache";
  cacheTag("catalog", `product:${slug}`);
  cacheLife("minutes");

  try {
    const row = await prisma.product.findFirst({
      where: { slug, active: true },
    });
    if (row) return mapDbProduct(row);
  } catch (err) {
    console.error("[catalog] getProduct failed", err);
  }
  return getStaticProduct(slug);
}

export async function getCatalogRelated(
  product: Product,
  limit = 4,
): Promise<Product[]> {
  "use cache";
  cacheTag("catalog", `related:${product.id}`);
  cacheLife("minutes");

  try {
    const rows = await prisma.product.findMany({
      where: {
        active: true,
        NOT: { id: product.id },
      },
      take: 24,
      orderBy: { updatedAt: "desc" },
    });
    const mapped = rows.map(mapDbProduct);
    const related = mapped
      .filter(
        (p) =>
          p.categorySlug === product.categorySlug ||
          p.occasion.some((o) => product.occasion.includes(o)),
      )
      .slice(0, limit);
    if (related.length > 0) return related;
  } catch (err) {
    console.error("[catalog] getRelated failed", err);
  }
  return getStaticRelated(product, limit);
}
