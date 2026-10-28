import { error, fromZod, json, requireAdmin } from "@/lib/admin/http";
import { applyStockChange, totalUnits } from "@/lib/admin/stock";
import { asSizeMap } from "@/lib/admin/types";
import { stockSingleSchema } from "@/lib/admin/validators";
import { prisma } from "@/lib/db";

export async function GET() {
  const { response } = await requireAdmin();
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
  const { admin, response } = await requireAdmin();
  if (response) return response;

  try {
    const body = stockSingleSchema.parse(await request.json());
    const result = await applyStockChange({
      ...body,
      adminId: admin.id,
      source: "single",
    });
    return json({ result });
  } catch (err) {
    if (err && typeof err === "object" && "issues" in err) {
      return fromZod(err as never);
    }
    return error(err instanceof Error ? err.message : "Stock update failed", 400);
  }
}
