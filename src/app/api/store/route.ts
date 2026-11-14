import { getStoreContact } from "@/lib/store-contact";
import { json } from "@/lib/http";

export async function GET() {
  return json({ contact: getStoreContact() });
}
