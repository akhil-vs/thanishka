import type { Metadata } from "next";

export const metadata: Metadata = { title: "Shipping" };

export default function ShippingPage() {
  return (
    <Info
      title="Shipping"
      body={[
        "Orders placed before 2pm IST are packed the same day when stock allows.",
        "Free shipping on orders above ₹1,999. Below that, a flat ₹99 applies within India.",
        "We ship across India with standard courier partners. You’ll get tracking once an order is marked Shipped — WhatsApp updates are available when you share a mobile number at checkout.",
        "Local Trivandrum customers may also collect from our Vellayambalam boutique.",
      ]}
    />
  );
}

function Info({ title, body }: { title: string; body: string[] }) {
  return (
    <div className="container-page max-w-2xl py-12 md:py-16">
      <h1 className="font-display text-3xl tracking-[0.14em]">{title}</h1>
      <div className="mt-8 space-y-4 font-serif text-lg leading-relaxed text-muted">
        {body.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
    </div>
  );
}
