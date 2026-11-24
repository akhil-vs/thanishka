import assert from "node:assert/strict";
import {
  buildOrderAlertMessage,
  isPlacedOrderStatus,
  paymentLabel,
  sanitizeTemplateParam,
  type AlertOrder,
} from "../src/lib/alerts/order-message";
import {
  buildWhatsAppRequest,
  digitsForWhatsApp,
  readWhatsAppSender,
  resolveAlertRecipient,
  sendOrderWhatsApp,
} from "../src/lib/alerts/whatsapp";

async function main() {
assert.equal(isPlacedOrderStatus("PAID"), true);
assert.equal(isPlacedOrderStatus("COD_CONFIRMED"), true);
assert.equal(isPlacedOrderStatus("PENDING_PAYMENT"), false);
assert.equal(isPlacedOrderStatus("PACKED"), false);
assert.equal(paymentLabel("COD", "COD_CONFIRMED"), "Cash on delivery");
assert.equal(paymentLabel("RAZORPAY", "PAID"), "Paid online");

assert.equal(digitsForWhatsApp("98765 43210"), null);
assert.equal(digitsForWhatsApp("+91 98765 43210"), null);
assert.equal(digitsForWhatsApp("98123 45678"), "919812345678");
assert.equal(digitsForWhatsApp("09812345678"), "919812345678");
assert.equal(digitsForWhatsApp("+44 7700 900123"), "447700900123");

const saved = {
  SHOP_ALERT_WHATSAPP: process.env.SHOP_ALERT_WHATSAPP,
  STORE_WHATSAPP: process.env.STORE_WHATSAPP,
  NEXT_PUBLIC_STORE_WHATSAPP: process.env.NEXT_PUBLIC_STORE_WHATSAPP,
  WHATSAPP_TOKEN: process.env.WHATSAPP_TOKEN,
  WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID,
  WHATSAPP_TEMPLATE_NAME: process.env.WHATSAPP_TEMPLATE_NAME,
  WHATSAPP_TEMPLATE_LANG: process.env.WHATSAPP_TEMPLATE_LANG,
  WHATSAPP_GRAPH_VERSION: process.env.WHATSAPP_GRAPH_VERSION,
};

function restoreEnv() {
  for (const [key, value] of Object.entries(saved)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

try {
  process.env.SHOP_ALERT_WHATSAPP = "919876543210";
  process.env.STORE_WHATSAPP = "919800000001";
  delete process.env.NEXT_PUBLIC_STORE_WHATSAPP;
  assert.equal(resolveAlertRecipient("918888877777"), "918888877777");

  delete process.env.SHOP_ALERT_WHATSAPP;
  assert.equal(resolveAlertRecipient(null), "919800000001");

  process.env.SHOP_ALERT_WHATSAPP = "+91 98111 12222";
  assert.equal(resolveAlertRecipient("910000000000"), "919811112222");

  delete process.env.WHATSAPP_TOKEN;
  delete process.env.WHATSAPP_PHONE_NUMBER_ID;
  assert.equal(readWhatsAppSender(), null);

  process.env.WHATSAPP_TOKEN = "test-token";
  process.env.WHATSAPP_PHONE_NUMBER_ID = "12345";
  process.env.WHATSAPP_GRAPH_VERSION = "v21.0/../evil";
  process.env.WHATSAPP_TEMPLATE_NAME = "Not A Name";
  process.env.WHATSAPP_TEMPLATE_LANG = "en_US";
  const sender = readWhatsAppSender();
  assert.ok(sender);
  assert.equal(sender?.graphVersion, "v21.0");
  assert.equal(sender?.templateName, null);
  assert.equal(sender?.templateLang, "en_US");
  assert.equal(sender?.token, "test-token");
} finally {
  restoreEnv();
}

const order: AlertOrder = {
  orderNumber: "TH-TEST1",
  status: "COD_CONFIRMED",
  paymentMethod: "COD",
  customerName: "Ananya Nair",
  customerEmail: "ananya@example.com",
  customerPhone: "+919812345678",
  shippingLine1: "12 Vellayambalam Road",
  shippingLine2: null,
  shippingCity: "Thiruvananthapuram",
  shippingState: "Kerala",
  shippingPostalCode: "695010",
  total: 4250,
  couponCode: "THANISHKA10",
  notes: "Please call\nbefore delivery",
  items: [
    { productName: "Kasavu Set", size: "M", quantity: 1 },
    { productName: "Linen Kurta", size: "S", quantity: 2 },
  ],
};

const message = buildOrderAlertMessage(order);
assert.match(message.title, /TH-TEST1/);
assert.match(message.body, /Ananya Nair/);
assert.match(message.body, /\+919812345678/);
assert.match(message.body, /ananya@example.com/);
assert.match(message.body, /Kasavu Set · M × 1/);
assert.match(message.body, /Linen Kurta · S × 2/);
assert.match(message.body, /4,250/);
assert.match(message.body, /Cash on delivery/);
assert.match(message.body, /THANISHKA10/);
assert.match(message.body, /Thiruvananthapuram/);
assert.match(message.body, /695010/);
assert.match(message.body, /Please call before delivery/);
assert.match(message.whatsappText, /^New order TH-TEST1/);
for (const param of message.templateParams) {
  assert.equal(param.includes("\n"), false);
  assert.equal(param.includes("\t"), false);
}
assert.equal(message.templateParams.length, 5);
assert.match(message.templateParams[4], /Note: Please call before delivery/);

const many = buildOrderAlertMessage({
  ...order,
  items: Array.from({ length: 10 }, (_, index) => ({
    productName: `Piece ${index + 1}`,
    size: "M",
    quantity: 1,
  })),
});
assert.match(many.body, /\+ 2 more/);
assert.equal(many.body.includes("Piece 10"), false);

assert.equal(sanitizeTemplateParam("  \n\t  "), "-");
assert.equal(sanitizeTemplateParam("a     b"), "a    b");

const textRequest = buildWhatsAppRequest(
  {
    token: "secret",
    phoneNumberId: "555",
    templateName: null,
    templateLang: "en",
    graphVersion: "v21.0",
  },
  "919812345678",
  message,
);
assert.equal(
  textRequest.url,
  "https://graph.facebook.com/v21.0/555/messages",
);
assert.equal(textRequest.body.type, "text");
assert.equal(
  (textRequest.body.text as { body: string }).body,
  message.whatsappText,
);

const templateRequest = buildWhatsAppRequest(
  {
    token: "secret",
    phoneNumberId: "555",
    templateName: "new_order_alert",
    templateLang: "en",
    graphVersion: "v21.0",
  },
  "919812345678",
  message,
);
assert.equal(templateRequest.body.type, "template");
const template = templateRequest.body.template as {
  name: string;
  components: Array<{ parameters: Array<{ text: string }> }>;
};
assert.equal(template.name, "new_order_alert");
assert.equal(template.components[0].parameters.length, 5);

const sent = await sendOrderWhatsApp({
  sender: {
    token: "secret",
    phoneNumberId: "555",
    templateName: null,
    templateLang: "en",
    graphVersion: "v21.0",
  },
  to: "919812345678",
  message,
  fetchImpl: async (url, init) => {
    assert.equal(url, "https://graph.facebook.com/v21.0/555/messages");
    const headers = new Headers(init.headers);
    assert.equal(headers.get("Authorization"), "Bearer secret");
    const payload = JSON.parse(String(init.body)) as { type: string; text: { body: string } };
    assert.equal(payload.type, "text");
    assert.match(payload.text.body, /Kasavu Set/);
    return new Response(JSON.stringify({ messages: [{ id: "wamid.1" }] }), {
      status: 200,
    });
  },
});
assert.equal(sent.ok, true);

const failed = await sendOrderWhatsApp({
  sender: {
    token: "secret",
    phoneNumberId: "555",
    templateName: "new_order_alert",
    templateLang: "en",
    graphVersion: "v21.0",
  },
  to: "919812345678",
  message,
  fetchImpl: async () =>
    new Response(
      JSON.stringify({ error: { message: "(#132000) template name does not exist" } }),
      { status: 400 },
    ),
});
assert.equal(failed.ok, false);
if (!failed.ok) assert.match(failed.error, /template name does not exist/);

console.log("order alerts ok");
}

main();
