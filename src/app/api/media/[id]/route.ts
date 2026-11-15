import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  if (!id || id.length > 64) {
    return new Response("Not found", { status: 404 });
  }

  const row = await prisma.uploadedImage.findUnique({
    where: { id },
    select: { bytes: true, contentType: true },
  });

  if (!row) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(new Uint8Array(row.bytes), {
    status: 200,
    headers: {
      "Content-Type": row.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Length": String(row.bytes.byteLength),
    },
  });
}
