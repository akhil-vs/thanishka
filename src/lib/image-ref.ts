/** Paths served by this app (local disk or Postgres media API). */
export function isAppHostedImageRef(value: string) {
  return value.startsWith("/uploads/") || value.startsWith("/api/media/");
}

/** App-hosted product video paths (local disk or Postgres media API). */
export function isAppHostedVideoRef(value: string) {
  return value.startsWith("/uploads/") || value.startsWith("/api/media/");
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

/** Absolute http(s) URL (e.g. Vercel Blob), or an app-hosted upload path. */
export function isVideoRef(value: string) {
  return isAppHostedVideoRef(value) || isHttpUrl(value);
}
