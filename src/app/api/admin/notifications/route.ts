import { connection } from "next/server";
import { z } from "zod";
import { requireBackoffice, json, error, fromZod } from "@/lib/admin/http";
import { prisma } from "@/lib/db";

const readSchema = z.object({
  all: z.boolean().optional(),
  ids: z.array(z.string().min(1).max(80)).max(40).optional(),
});

function serializeAlert(alert: {
  id: string;
  orderId: string;
  title: string;
  body: string;
  whatsappStatus: string;
  readAt: Date | null;
  createdAt: Date;
}) {
  return {
    id: alert.id,
    orderId: alert.orderId,
    title: alert.title,
    body: alert.body,
    whatsappStatus: alert.whatsappStatus,
    readAt: alert.readAt?.toISOString() ?? null,
    createdAt: alert.createdAt.toISOString(),
  };
}

export async function GET() {
  await connection();
  const { response } = await requireBackoffice();
  if (response) return response;

  const [alerts, unreadCount] = await Promise.all([
    prisma.orderAlert.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.orderAlert.count({ where: { readAt: null } }),
  ]);

  return json(
    {
      alerts: alerts.map(serializeAlert),
      unreadCount,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  await connection();
  const { response } = await requireBackoffice();
  if (response) return response;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return error("Invalid JSON body");
  }

  const parsed = readSchema.safeParse(payload);
  if (!parsed.success) return fromZod(parsed.error);

  const ids = parsed.data.ids ?? [];
  if (parsed.data.all !== true && ids.length === 0) {
    return error("Nothing to mark read");
  }

  await prisma.orderAlert.updateMany({
    where:
      parsed.data.all === true
        ? { readAt: null }
        : { id: { in: ids }, readAt: null },
    data: { readAt: new Date() },
  });

  return json({ ok: true });
}
