import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import {
  ALLOWED_VIDEO_TYPES,
  getVideoUploadStrategy,
  isAllowedVideoType,
  maxVideoBytesForStrategy,
  MAX_VIDEO_UPLOAD_BYTES,
  storeUploadedVideo,
} from "@/lib/admin/uploads";
import { error, json, requireBackoffice } from "@/lib/admin/http";

/**
 * Product video uploads (original bytes, no re-encode).
 * - JSON → Vercel Blob client-token flow (browser → Blob; preferred for larger files).
 * - multipart → local disk (dev) or Postgres media (Vercel without Blob, smaller cap).
 */
export async function GET() {
  const { response } = await requireBackoffice();
  if (response) return response;

  const strategy = getVideoUploadStrategy();
  return json({
    strategy,
    maxBytes: maxVideoBytesForStrategy(strategy),
    allowedTypes: [...ALLOWED_VIDEO_TYPES],
  });
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    return handleMultipart(request);
  }

  return handleClientBlob(request);
}

async function handleMultipart(request: Request) {
  const { response } = await requireBackoffice();
  if (response) return response;

  const strategy = getVideoUploadStrategy();
  if (strategy === "blob") {
    return error(
      "Use direct Blob upload for product videos when Vercel Blob is configured.",
      400,
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return error("Expected multipart form data", 400);
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return error("Choose a video file to upload", 400);
  }

  if (!isAllowedVideoType(file.type)) {
    return error(
      `Unsupported video type. Use ${[...ALLOWED_VIDEO_TYPES].join(", ")}`,
      400,
    );
  }

  const maxBytes = maxVideoBytesForStrategy(strategy);
  if (file.size > maxBytes) {
    const mb = Math.round(maxBytes / (1024 * 1024));
    if (strategy === "database") {
      return error(
        `Without Vercel Blob, product videos must be ${mb} MB or smaller. Connect Blob (BLOB_READ_WRITE_TOKEN) for up to 80 MB uploads.`,
        400,
      );
    }
    return error(`Video must be ${mb} MB or smaller`, 400);
  }

  try {
    const stored = await storeUploadedVideo(file);
    return json(stored, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unable to store uploaded video";
    return error(message, 500);
  }
}

async function handleClientBlob(request: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return error(
      "Vercel Blob is not configured. Use multipart upload (local/database fallback), or set BLOB_READ_WRITE_TOKEN for larger videos.",
      503,
    );
  }

  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return error("Expected JSON body for Blob client upload", 400);
  }

  try {
    const result = await handleUpload({
      body,
      request,
      token: process.env.BLOB_READ_WRITE_TOKEN,
      onBeforeGenerateToken: async () => {
        // Cookie session is present on the browser → token hop.
        const { response } = await requireBackoffice();
        if (response) {
          throw new Error("Unauthorized");
        }

        return {
          allowedContentTypes: [...ALLOWED_VIDEO_TYPES],
          maximumSizeInBytes: MAX_VIDEO_UPLOAD_BYTES,
          addRandomSuffix: true,
          // Original bytes only — no server-side re-encode.
          cacheControlMaxAge: 31536000,
        };
      },
      onUploadCompleted: async () => {
        // URL is attached when the admin saves the product form.
      },
    });

    return json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unable to authorize video upload";
    const status = message === "Unauthorized" ? 401 : 400;
    return error(message, status);
  }
}
