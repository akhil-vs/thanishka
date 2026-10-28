import { error, fromZod, json, requireAdmin } from "@/lib/admin/http";
import { discountInputSchema } from "@/lib/admin/validators";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { response } = await requireAdmin();
  if (response) return response;

  try {
    const { id } = await params;
    const body = discountInputSchema.partial().parse(await request.json());
    const existing = await prisma.discount.findUnique({ where: { id } });
    if (!existing) return error("Discount not found", 404);

    const discount = await prisma.discount.update({
      where: { id },
      data: {
        ...body,
        code: body.code ? body.code.trim().toUpperCase() : undefined,
        maxUses: body.maxUses === undefined ? undefined : body.maxUses,
        startsAt:
          body.startsAt === undefined
            ? undefined
            : body.startsAt
              ? new Date(body.startsAt)
              : null,
        endsAt:
          body.endsAt === undefined
            ? undefined
            : body.endsAt
              ? new Date(body.endsAt)
              : null,
      },
    });
    return json({ discount });
  } catch (err) {
    if (err && typeof err === "object" && "issues" in err) {
      return fromZod(err as never);
    }
    return error("Unable to update discount", 500);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  const existing = await prisma.discount.findUnique({ where: { id } });
  if (!existing) return error("Discount not found", 404);
  await prisma.discount.delete({ where: { id } });
  return json({ ok: true });
}
