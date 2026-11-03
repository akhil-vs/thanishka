import { error, fromZod, json, requireAdmin } from "@/lib/admin/http";
import { ensureShop } from "@/lib/auth/users";
import { prisma } from "@/lib/db";
import { z } from "zod";

const shopUpdateSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  phone: z.string().max(20).nullable().optional(),
  whatsapp: z.string().max(20).nullable().optional(),
  gstin: z.string().max(20).nullable().optional(),
  active: z.boolean().optional(),
});

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const shop = await ensureShop();
  const full = await prisma.shop.findUniqueOrThrow({ where: { id: shop.id } });
  const [owners, staff, customers] = await Promise.all([
    prisma.roleAssignment.count({
      where: { shopId: shop.id, role: "SHOP_OWNER" },
    }),
    prisma.roleAssignment.count({
      where: { shopId: shop.id, role: "SHOP_STAFF" },
    }),
    prisma.roleAssignment.count({ where: { role: "CUSTOMER" } }),
  ]);

  return json({
    shop: full,
    counts: { owners, staff, customers },
  });
}

export async function PATCH(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  try {
    const body = shopUpdateSchema.parse(await request.json());
    const shop = await ensureShop();
    const updated = await prisma.shop.update({
      where: { id: shop.id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.phone !== undefined ? { phone: body.phone } : {}),
        ...(body.whatsapp !== undefined ? { whatsapp: body.whatsapp } : {}),
        ...(body.gstin !== undefined ? { gstin: body.gstin } : {}),
        ...(body.active !== undefined ? { active: body.active } : {}),
      },
    });
    return json({ shop: updated });
  } catch (err) {
    if (err && typeof err === "object" && "issues" in err) {
      return fromZod(err as never);
    }
    return error("Unable to update shop", 500);
  }
}
