import { formatINR } from "@/lib/format";

export type AlertOrderItem = {
  productName: string;
  size: string;
  quantity: number;
};

export type AlertOrder = {
  orderNumber: string;
  status: string;
  paymentMethod: string;
  customerName: string;
  customerEmail?: string | null;
  customerPhone: string;
  shippingLine1: string;
  shippingLine2?: string | null;
  shippingCity: string;
  shippingState: string;
  shippingPostalCode: string;
  total: number;
  couponCode?: string | null;
  notes?: string | null;
  items: AlertOrderItem[];
};

export type OrderAlertMessage = {
  title: string;
  body: string;
  whatsappText: string;
  templateParams: [string, string, string, string, string];
};

const PLACED = new Set(["PAID", "COD_CONFIRMED"]);

export function isPlacedOrderStatus(status: string) {
  return PLACED.has(status);
}

export function paymentLabel(method: string, status: string) {
  if (method === "COD" || status === "COD_CONFIRMED") return "Cash on delivery";
  if (method === "RAZORPAY" || status === "PAID") return "Paid online";
  return method.replaceAll("_", " ");
}

/** WhatsApp template parameters reject newlines, tabs, and long space runs. */
export function sanitizeTemplateParam(value: string) {
  const cleaned = value
    .replace(/[\r\n\t]+/g, " ")
    .replace(/ {5,}/g, "    ")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .slice(0, 900);
  return cleaned.length > 0 ? cleaned : "-";
}

function itemLine(item: AlertOrderItem) {
  const name = item.productName.trim() || "Item";
  const size = item.size.trim();
  return size ? `${name} · ${size} × ${item.quantity}` : `${name} × ${item.quantity}`;
}

function listedItems(items: AlertOrderItem[]) {
  if (items.length === 0) return ["No items listed"];
  const shown = items.slice(0, 8).map(itemLine);
  if (items.length > 8) shown.push(`+ ${items.length - 8} more`);
  return shown;
}

export function buildOrderAlertMessage(order: AlertOrder): OrderAlertMessage {
  const title = `New order ${order.orderNumber.trim() || "order"}`;
  const name = order.customerName.trim() || "Customer";
  const phone = order.customerPhone.trim();
  const email = order.customerEmail?.trim() || "";
  const contact = [name, phone, email].filter(Boolean);

  const totalBits = [
    `Total ${formatINR(order.total)}`,
    paymentLabel(order.paymentMethod, order.status),
  ];
  if (order.couponCode?.trim()) totalBits.push(`Coupon ${order.couponCode.trim()}`);
  const totalLine = totalBits.join(" · ");

  const ship = [
    order.shippingLine1,
    order.shippingLine2,
    order.shippingCity,
    order.shippingState,
    order.shippingPostalCode,
  ]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(", ");

  const note = order.notes?.trim().replace(/\s+/g, " ").slice(0, 280) || "";
  const itemLines = listedItems(order.items);

  const body = [
    contact.join("\n"),
    "",
    itemLines.join("\n"),
    "",
    totalLine,
    ship ? `Ship to: ${ship}` : null,
    note ? `Note: ${note}` : null,
  ]
    .filter((line): line is string => line !== null)
    .join("\n")
    .slice(0, 3500);

  const whatsappText = `${title}\n\n${body}`.slice(0, 4000);
  const templateParams: OrderAlertMessage["templateParams"] = [
    sanitizeTemplateParam(order.orderNumber.trim() || "order"),
    sanitizeTemplateParam(contact.join(" · ")),
    sanitizeTemplateParam(totalLine),
    sanitizeTemplateParam(itemLines.join(" · ")),
    sanitizeTemplateParam(
      [ship || "Address not provided", note ? `Note: ${note}` : ""]
        .filter(Boolean)
        .join(" · "),
    ),
  ];

  return { title, body, whatsappText, templateParams };
}
