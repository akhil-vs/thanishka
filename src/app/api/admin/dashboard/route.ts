import { asSizeMap } from "@/lib/admin/types";
import { requireAdmin, json } from "@/lib/admin/http";
import { totalUnits } from "@/lib/admin/stock";
import { prisma } from "@/lib/db";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const [allProducts, discountCount, offerCount, heroCount, recentMovements] =
    await Promise.all([
      prisma.product.findMany(),
      prisma.discount.count({ where: { active: true } }),
      prisma.offer.count({ where: { active: true } }),
      prisma.heroSlide.count({ where: { active: true } }),
      prisma.stockMovement.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
    ]);

  const activeProducts = allProducts.filter((p) => p.active);
  const withTotals = activeProducts.map((p) => ({
    ...p,
    sizes: asSizeMap(p.sizes),
    total: totalUnits(asSizeMap(p.sizes)),
  }));
  const lowStock = withTotals.filter((p) => p.total <= 5);
  const outOfStock = withTotals.filter((p) => p.total === 0);

  return json({
    stats: {
      products: allProducts.length,
      activeProducts: activeProducts.length,
      totalUnits: withTotals.reduce((sum, p) => sum + p.total, 0),
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
      total: p.total,
      sizes: p.sizes,
    })),
    recentMovements,
    generatedAt: new Date().toISOString(),
  });
}
