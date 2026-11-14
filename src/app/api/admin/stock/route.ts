import { error, fromZod, json, requireBackoffice } from "@/lib/admin/http";
import { applyStockChange, totalUnits } from "@/lib/admin/stock";
import { asSizeMap } from "@/lib/admin/types";
import { stockSingleSchema } from "@/lib/admin/validators";
import { revalidateCatalog } from "@/lib/catalog-revalidate";
import { prisma } from "@/lib/db";

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

  return json({
    stock: rows.map((p) => {
      const sizes = asSizeMap(p.sizes);
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        active: p.active,
        sizes,
        total: totalUnits(sizes),
      };
    }),
    movements,
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
