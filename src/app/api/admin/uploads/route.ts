import {
  ALLOWED_IMAGE_TYPES,
  isAllowedImageType,
  MAX_UPLOAD_BYTES,
  storeUploadedImage,
} from "@/lib/admin/uploads";
import { error, json, requireBackoffice } from "@/lib/admin/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { response } = await requireBackoffice();
  if (response) return response;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return error("Expected multipart form data", 400);
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return error("Choose an image file to upload", 400);
  }

  if (!isAllowedImageType(file.type)) {
    return error(
      `Unsupported file type. Use ${[...ALLOWED_IMAGE_TYPES].join(", ")}`,
      400,
    );
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return error("Image must be 4 MB or smaller", 400);
  }

  try {
    const stored = await storeUploadedImage(file);
    return json(stored, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unable to store uploaded image";
    return error(message, 500);
  }
}
