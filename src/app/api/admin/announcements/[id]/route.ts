import { error, fromZod, json, requireBackoffice } from "@/lib/admin/http";
import { announcementInputSchema } from "@/lib/admin/validators";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { response } = await requireBackoffice();
  if (response) return response;

  try {
    const { id } = await params;
    const body = announcementInputSchema.partial().parse(await request.json());
    const existing = await prisma.announcement.findUnique({ where: { id } });
    if (!existing) return error("Announcement not found", 404);

    const announcement = await prisma.announcement.update({
      where: { id },
      data: {
        ...body,
        ...(body.message !== undefined
          ? { message: body.message.trim() }
          : {}),
      },
    });
    return json({ announcement });
  } catch (err) {
    if (err && typeof err === "object" && "issues" in err) {
      return fromZod(err as never);
    }
    return error("Unable to update announcement", 500);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { response } = await requireBackoffice();
  if (response) return response;

  const { id } = await params;
  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing) return error("Announcement not found", 404);
  await prisma.announcement.delete({ where: { id } });
  return json({ ok: true });
}
