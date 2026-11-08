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
    storage: "blob" | "local";
  }>("/api/admin/uploads", {
    method: "POST",
    body,
  });
}
