import { listCatalogProducts } from "@/lib/catalog";
import { error, json } from "@/lib/http";

export async function GET() {
  try {
    const products = await listCatalogProducts();
    return json({ products });
  } catch (err) {
    console.error("[api/products]", err);
    return error("Unable to load products", 500);
  }
}
