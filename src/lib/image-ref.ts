/** Paths served by this app (local disk or Postgres media API). */
export function isAppHostedImageRef(value: string) {
  return value.startsWith("/uploads/") || value.startsWith("/api/media/");
}

/** Absolute http(s) URL, or an app-hosted upload path. */
export function isImageRef(value: string) {
  if (isAppHostedImageRef(value)) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
