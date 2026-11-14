import { connection } from "next/server";
import { json } from "@/lib/http";
import { listPublishedTestimonials } from "@/lib/feedback/feedback";

export async function GET(request: Request) {
  await connection();
  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") || 12);
  const testimonials = await listPublishedTestimonials(
    Number.isFinite(limit) ? limit : 12,
  );
  return json({ testimonials });
}
