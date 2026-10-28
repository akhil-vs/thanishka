import { error, fromZod, json, requireAdmin } from "@/lib/admin/http";
import { heroInputSchema } from "@/lib/admin/validators";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { response } = await requireAdmin();
  if (response) return response;

  try {
    const { id } = await params;
    const body = heroInputSchema.partial().parse(await request.json());
    const existing = await prisma.heroSlide.findUnique({ where: { id } });
    if (!existing) return error("Hero slide not found", 404);

    const slide = await prisma.heroSlide.update({
      where: { id },
      data: body,
    });
    return json({ slide });
  } catch (err) {
    if (err && typeof err === "object" && "issues" in err) {
      return fromZod(err as never);
    }
    return error("Unable to update hero slide", 500);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  const existing = await prisma.heroSlide.findUnique({ where: { id } });
  if (!existing) return error("Hero slide not found", 404);
  await prisma.heroSlide.delete({ where: { id } });
  return json({ ok: true });
}
