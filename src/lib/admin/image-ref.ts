/** Absolute http(s) URL, or a local /uploads/... path from disk storage. */
export function isImageRef(value: string) {
  if (value.startsWith("/uploads/")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
