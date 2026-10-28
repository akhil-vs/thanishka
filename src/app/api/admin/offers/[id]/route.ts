import { error, fromZod, json, requireAdmin } from "@/lib/admin/http";
import { offerInputSchema } from "@/lib/admin/validators";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { response } = await requireAdmin();
  if (response) return response;

  try {
    const { id } = await params;
    const body = offerInputSchema.partial().parse(await request.json());
    const existing = await prisma.offer.findUnique({ where: { id } });
    if (!existing) return error("Offer not found", 404);

    const offer = await prisma.offer.update({
      where: { id },
      data: {
        ...body,
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
    return json({ offer });
  } catch (err) {
    if (err && typeof err === "object" && "issues" in err) {
      return fromZod(err as never);
    }
    return error("Unable to update offer", 500);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  const existing = await prisma.offer.findUnique({ where: { id } });
  if (!existing) return error("Offer not found", 404);
  await prisma.offer.delete({ where: { id } });
  return json({ ok: true });
}
