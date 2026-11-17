/** Paths served by this app (local disk or Postgres media API). */
export function isAppHostedImageRef(value: string) {
  return value.startsWith("/uploads/") || value.startsWith("/api/media/");
}

/** Local product video paths under public/uploads. */
export function isAppHostedVideoRef(value: string) {
  return value.startsWith("/uploads/");
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/** Absolute http(s) URL, or an app-hosted upload path. */
export function isImageRef(value: string) {
  return isAppHostedImageRef(value) || isHttpUrl(value);
}

/** Absolute http(s) URL (e.g. Vercel Blob), or a local /uploads path. */
export function isVideoRef(value: string) {
  return isAppHostedVideoRef(value) || isHttpUrl(value);
}
