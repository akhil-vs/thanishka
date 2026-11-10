import { json, requireAdmin } from "@/lib/admin/http";
import { prisma } from "@/lib/db";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      roleAssignments: {
        include: { shop: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return json({
    users: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      active: u.active,
      createdAt: u.createdAt,
      roles: u.roleAssignments.map((r) => ({
        role: r.role,
        shopId: r.shopId,
        shopName: r.shop?.name ?? null,
      })),
    })),
  });
}
