import { error, fromZod, json, requireBackoffice } from "@/lib/admin/http";
import { applyStockChange, totalUnits } from "@/lib/admin/stock";
import { asSizeMap, asStringArray } from "@/lib/admin/types";
import { stockSingleSchema } from "@/lib/admin/validators";
import { revalidateCatalog } from "@/lib/catalog-revalidate";
import { prisma } from "@/lib/db";

const LOW_STOCK_TOTAL = 5;

export async function GET() {
  const { response } = await requireBackoffice();
  if (response) return response;

  const [rows, movements] = await Promise.all([
    prisma.product.findMany({ orderBy: { name: "asc" } }),
    prisma.stockMovement.findMany({
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
  ]);

  const stock = rows.map((p) => {
    const sizes = asSizeMap(p.sizes);
    const images = asStringArray(p.images);
    const total = totalUnits(sizes);
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      active: p.active,
      category: p.category,
      categorySlug: p.categorySlug,
      price: p.price,
      image: images[0] ?? null,
      sizes,
      total,
    };
  });

  const active = stock.filter((p) => p.active);
  const totalUnitsCount = active.reduce((sum, p) => sum + p.total, 0);
  const lowStockCount = active.filter(
    (p) => p.total > 0 && p.total <= LOW_STOCK_TOTAL,
  ).length;
  const outOfStockCount = active.filter((p) => p.total === 0).length;
  const retailValue = active.reduce((sum, p) => sum + p.price * p.total, 0);

  return json({
    stock,
    movements,
    summary: {
      activeStyles: active.length,
      totalUnits: totalUnitsCount,
      lowStock: lowStockCount,
      outOfStock: outOfStockCount,
      retailValue,
      lowStockThreshold: LOW_STOCK_TOTAL,
    },
  });
}

export async function PATCH(request: Request) {
  const { user, response } = await requireBackoffice();
  if (response || !user) return response;

  try {
    const body = stockSingleSchema.parse(await request.json());
    const result = await applyStockChange({
      ...body,
      userId: user.id,
      source: "single",
    });
    revalidateCatalog();
    return json({ result });
  } catch (err) {
    if (err && typeof err === "object" && "issues" in err) {
      return fromZod(err as never);
    }
    return error(err instanceof Error ? err.message : "Stock update failed", 400);
  }
}
