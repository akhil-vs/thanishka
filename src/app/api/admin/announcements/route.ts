import { error, fromZod, json, requireBackoffice } from "@/lib/admin/http";
import { announcementInputSchema } from "@/lib/admin/validators";
import { prisma } from "@/lib/db";

export async function GET() {
  const { response } = await requireBackoffice();
  if (response) return response;

  const announcements = await prisma.announcement.findMany({
    orderBy: { sortOrder: "asc" },
  });
  return json({ announcements });
}

export async function POST(request: Request) {
  const { response } = await requireBackoffice();
  if (response) return response;

  try {
    const body = announcementInputSchema.parse(await request.json());
    const announcement = await prisma.announcement.create({
      data: {
        message: body.message.trim(),
        active: body.active ?? true,
        sortOrder: body.sortOrder ?? 0,
      },
    });
    return json({ announcement }, { status: 201 });
  } catch (err) {
    if (err && typeof err === "object" && "issues" in err) {
      return fromZod(err as never);
    }
    return error("Unable to create announcement", 500);
  }
}
