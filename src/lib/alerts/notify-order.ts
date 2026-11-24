import { Prisma, WhatsAppDelivery } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  buildOrderAlertMessage,
  isPlacedOrderStatus,
} from "@/lib/alerts/order-message";
import {
  readWhatsAppSender,
  resolveAlertRecipient,
  sendOrderWhatsApp,
} from "@/lib/alerts/whatsapp";

function isUniqueConflict(err: unknown) {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002"
  );
}

/**
 * Store an in-app shop alert and send WhatsApp once per placed order.
 * Safe to call from both payment verify and the webhook — the unique order
 * row keeps a single alert and a single WhatsApp send.
 */
export async function notifyShopOfPlacedOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order || !isPlacedOrderStatus(order.status)) return null;

  const message = buildOrderAlertMessage({
    orderNumber: order.orderNumber,
    status: order.status,
    paymentMethod: order.paymentMethod,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    shippingLine1: order.shippingLine1,
    shippingLine2: order.shippingLine2,
    shippingCity: order.shippingCity,
    shippingState: order.shippingState,
    shippingPostalCode: order.shippingPostalCode,
    total: order.total,
    couponCode: order.couponCode,
    notes: order.notes,
    items: order.items.map((item) => ({
      productName: item.productName,
      size: item.size,
      quantity: item.quantity,
    })),
  });

  const shop = await prisma.shop.findFirst({
    where: { active: true },
    orderBy: { createdAt: "asc" },
    select: { whatsapp: true },
  });
  const to = resolveAlertRecipient(shop?.whatsapp);
  const sender = readWhatsAppSender();
  const canSend = Boolean(sender && to);

  let alertId: string;
  try {
    const created = await prisma.orderAlert.create({
      data: {
        orderId: order.id,
        title: message.title,
        body: message.body,
        whatsappStatus: canSend
          ? WhatsAppDelivery.PENDING
          : WhatsAppDelivery.SKIPPED,
        whatsappError: canSend ? null : "WhatsApp is not configured",
      },
      select: { id: true },
    });
    alertId = created.id;
  } catch (err) {
    if (isUniqueConflict(err)) return null;
    throw err;
  }

  if (!canSend || !sender || !to) {
    console.info(
      `[alerts] in-app alert stored for ${order.orderNumber}; WhatsApp skipped`,
    );
    return alertId;
  }

  const result = await sendOrderWhatsApp({ sender, to, message });
  await prisma.orderAlert.update({
    where: { id: alertId },
    data: {
      whatsappStatus: result.ok ? WhatsAppDelivery.SENT : WhatsAppDelivery.FAILED,
      whatsappError: result.ok ? null : result.error,
    },
  });

  if (result.ok) {
    console.info(`[alerts] WhatsApp sent for ${order.orderNumber}`);
  } else {
    console.warn(
      `[alerts] WhatsApp failed for ${order.orderNumber}: ${result.error}`,
    );
  }
  return alertId;
}

export async function queueShopOrderAlert(orderId: string) {
  try {
    await notifyShopOfPlacedOrder(orderId);
  } catch (err) {
    console.error(`[alerts] failed for order ${orderId}`, err);
  }
}
