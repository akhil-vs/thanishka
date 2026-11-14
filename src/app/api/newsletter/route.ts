import { z } from "zod";
import { prisma } from "@/lib/db";
import { error, fromZod, json } from "@/lib/http";

const schema = z.object({
  email: z.string().email(),
  whatsappOptIn: z.boolean().optional(),
  phone: z.string().max(20).optional().nullable(),
  source: z.string().max(40).optional(),
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const email = body.email.trim().toLowerCase();

    const subscriber = await prisma.newsletterSubscriber.upsert({
      where: { email },
      create: {
        email,
        whatsappOptIn: Boolean(body.whatsappOptIn),
        phone: body.phone?.trim() || null,
        source: body.source?.trim() || "storefront",
      },
      update: {
        whatsappOptIn: Boolean(body.whatsappOptIn),
        phone: body.phone?.trim() || undefined,
      },
    });

    return json({
      ok: true,
      couponCode: "THANISHKA10",
      message: "You’re on the list — use THANISHKA10 at checkout.",
      id: subscriber.id,
    });
  } catch (err) {
    if (err && typeof err === "object" && "issues" in err) {
      return fromZod(err as never);
    }
    console.error("[api/newsletter]", err);
    return error("Could not save your email. Please try again.", 500);
  }
}
