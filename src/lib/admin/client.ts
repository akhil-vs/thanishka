export async function adminFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const isFormData =
    typeof FormData !== "undefined" && init?.body instanceof FormData;
  const res = await fetch(path, {
    ...init,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(init?.headers ?? {}),
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data?.error === "string" ? data.error : `Request failed (${res.status})`,
    );
  }
  return data as T;
}

export async function adminUpload(file: File) {
  const body = new FormData();
  body.append("file", file);
  return adminFetch<{
    url: string;
    pathname: string;
    storage: "blob" | "local" | "database";
  }>("/api/admin/uploads", {
    method: "POST",
    body,
  });
}

function videoUploadPathname(file: File) {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const base =
    file.name
      .toLowerCase()
      .replace(/\.[a-z0-9]+$/, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "video";
  const ext =
    file.type === "video/webm"
      ? "webm"
      : file.type === "video/quicktime"
        ? "mov"
        : "mp4";
  return `uploads/videos/${stamp}-${base}.${ext}`;
}

/**
 * Optional product video: originals only (no re-encode).
 * Uses direct-to-Blob when configured (avoids serverless body limits + DB bloat);
 * falls back to local multipart in development.
 */
export async function adminUploadVideo(file: File) {
  const mode = await adminFetch<{
    strategy: "blob" | "local";
    maxBytes: number;
  }>("/api/admin/uploads/video");

  if (file.size > mode.maxBytes) {
    throw new Error("Video must be 80 MB or smaller");
  }

  if (mode.strategy === "blob") {
    const { upload } = await import("@vercel/blob/client");
    const blob = await upload(videoUploadPathname(file), file, {
      access: "public",
      handleUploadUrl: "/api/admin/uploads/video",
      contentType: file.type || "video/mp4",
      multipart: file.size > 5 * 1024 * 1024,
    });
    return {
      url: blob.url,
      pathname: blob.pathname,
      storage: "blob" as const,
    };
  }

  const body = new FormData();
  body.append("file", file);
  return adminFetch<{
    url: string;
    pathname: string;
    storage: "local";
  }>("/api/admin/uploads/video", {
    method: "POST",
    body,
  });
}
