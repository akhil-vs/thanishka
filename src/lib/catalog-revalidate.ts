import { revalidateTag } from "next/cache";

/** Bust storefront catalog caches after admin/stock mutations. */
export function revalidateCatalog() {
  revalidateTag("catalog", "max");
}
