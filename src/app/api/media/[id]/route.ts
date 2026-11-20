import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

function parseRange(header: string | null, size: number) {
  if (!header) return null;
  const match = header.match(/^bytes=(\d*)-(\d*)$/i);
  if (!match) return null;
  const startRaw = match[1];
  const endRaw = match[2];
  if (!startRaw && !endRaw) return null;

  let start = startRaw ? Number(startRaw) : 0;
  let end = endRaw ? Number(endRaw) : size - 1;
  if (!startRaw && endRaw) {
    // suffix form: bytes=-N
    const suffix = Number(endRaw);
    if (!Number.isFinite(suffix) || suffix <= 0) return null;
    start = Math.max(0, size - suffix);
    end = size - 1;
  }

  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    start < 0 ||
    end < start ||
    start >= size
  ) {
    return null;
  }
  end = Math.min(end, size - 1);
  return { start, end };
}

export async function GET(request: Request, { params }: Params) {
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

  const bytes = Buffer.from(row.bytes);
  const size = bytes.byteLength;
  const contentType = row.contentType;
  const cacheControl = "public, max-age=31536000, immutable";
  const range = parseRange(request.headers.get("range"), size);

  if (range) {
    const { start, end } = range;
    const chunk = bytes.subarray(start, end + 1);
    return new Response(new Uint8Array(chunk), {
      status: 206,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(chunk.byteLength),
        "Content-Range": `bytes ${start}-${end}/${size}`,
        "Accept-Ranges": "bytes",
        "Cache-Control": cacheControl,
      },
    });
  }

  return new Response(new Uint8Array(bytes), {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": cacheControl,
      "Content-Length": String(size),
      "Accept-Ranges": "bytes",
    },
  });
}
