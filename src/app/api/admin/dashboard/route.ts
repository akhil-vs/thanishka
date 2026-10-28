import { count, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { discounts, heroSlides, offers, products, stockMovements } from "@/db/schema";
import { requireAdmin, json } from "@/lib/admin/http";
import { totalUnits } from "@/lib/admin/stock";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const db = getDb();
  const allProducts = db.select().from(products).all();
  const activeProducts = allProducts.filter((p) => p.active);
  const lowStock = activeProducts.filter((p) => totalUnits(p.sizes) <= 5);
  const outOfStock = activeProducts.filter((p) => totalUnits(p.sizes) === 0);

  const [{ value: discountCount }] = db
    .select({ value: count() })
    .from(discounts)
    .where(eq(discounts.active, true))
    .all();
  const [{ value: offerCount }] = db
    .select({ value: count() })
    .from(offers)
    .where(eq(offers.active, true))
    .all();
  const [{ value: heroCount }] = db
    .select({ value: count() })
    .from(heroSlides)
    .where(eq(heroSlides.active, true))
    .all();

  const recentMovements = db
    .select()
    .from(stockMovements)
    .orderBy(desc(stockMovements.createdAt))
    .limit(8)
    .all();

  return json({
    stats: {
      products: allProducts.length,
      activeProducts: activeProducts.length,
      totalUnits: activeProducts.reduce((sum, p) => sum + totalUnits(p.sizes), 0),
      lowStock: lowStock.length,
      outOfStock: outOfStock.length,
      discounts: discountCount,
      offers: offerCount,
      heroSlides: heroCount,
    },
    lowStock: lowStock.slice(0, 6).map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      total: totalUnits(p.sizes),
      sizes: p.sizes,
    })),
    recentMovements,
    generatedAt: new Date().toISOString(),
  });
}
