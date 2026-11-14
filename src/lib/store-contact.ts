export type StoreContact = {
  name: string;
  phone: string | null;
  whatsapp: string | null;
  email: string;
  addressLine: string;
  hours: string;
  mapQuery: string;
  instagram: string | null;
};

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function looksPlaceholder(phone: string | null | undefined) {
  if (!phone) return true;
  const digits = digitsOnly(phone);
  return (
    digits === "919876543210" ||
    digits === "9876543210" ||
    digits.endsWith("9876543210")
  );
}

/**
 * Public boutique contact. Prefer env overrides so production never ships
 * the demo placeholder number. WhatsApp / floating chat hide when unset.
 */
export function getStoreContact(): StoreContact {
  const phone =
    process.env.NEXT_PUBLIC_STORE_PHONE?.trim() ||
    process.env.STORE_PHONE?.trim() ||
    null;
  const whatsappRaw =
    process.env.NEXT_PUBLIC_STORE_WHATSAPP?.trim() ||
    process.env.STORE_WHATSAPP?.trim() ||
    phone;
  const whatsapp =
    whatsappRaw && !looksPlaceholder(whatsappRaw)
      ? digitsOnly(whatsappRaw)
      : null;

  return {
    name: "Thanishka",
    phone: phone && !looksPlaceholder(phone) ? phone : null,
    whatsapp,
    email:
      process.env.NEXT_PUBLIC_STORE_EMAIL?.trim() ||
      process.env.STORE_EMAIL?.trim() ||
      "hello@thanishka.store",
    addressLine:
      process.env.NEXT_PUBLIC_STORE_ADDRESS?.trim() ||
      process.env.STORE_ADDRESS?.trim() ||
      "Vellayambalam, Thiruvananthapuram, Kerala 695010",
    hours:
      process.env.NEXT_PUBLIC_STORE_HOURS?.trim() ||
      process.env.STORE_HOURS?.trim() ||
      "Mon–Sun · 10:30am – 8:00pm",
    mapQuery:
      process.env.NEXT_PUBLIC_STORE_MAP_QUERY?.trim() ||
      process.env.STORE_MAP_QUERY?.trim() ||
      "Vellayambalam Thiruvananthapuram",
    instagram:
      process.env.NEXT_PUBLIC_STORE_INSTAGRAM?.trim() ||
      process.env.STORE_INSTAGRAM?.trim() ||
      null,
  };
}

export function whatsappHref(text?: string) {
  const { whatsapp } = getStoreContact();
  if (!whatsapp) return null;
  const base = `https://wa.me/${whatsapp}`;
  if (!text) return base;
  return `${base}?text=${encodeURIComponent(text)}`;
}
