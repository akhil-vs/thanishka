import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ",
};

const faqs = [
  {
    q: "Do you offer custom stitching?",
    a: "No — Thanishka is readymade only, stocked from XS to XXL for faster delivery and consistent fit.",
  },
  {
    q: "How do I know my size?",
    a: "Open the size chart on each product — charts differ for kurtis, gowns, co-ords, and set-sarees. Between sizes? Prefer the larger bust, or WhatsApp us your bust/waist/hip.",
  },
  {
    q: "What payment methods do you accept?",
    a: "UPI, cards, net banking and cash on delivery via our payment partners. A payment receipt is included with every order; ask us on WhatsApp if you need a GST tax invoice.",
  },
  {
    q: "How long does shipping take?",
    a: "Trivandrum PIN codes usually 1–2 days; rest of India 3–6 days after packing. Free shipping above ₹1,999.",
  },
  {
    q: "Can I return or exchange?",
    a: "Unused items with tags can be exchanged within 7 days. See our Returns page for details.",
  },
];

export default function FAQPage() {
  return (
    <div className="container-page max-w-2xl py-12 md:py-16">
      <h1 className="font-display text-3xl tracking-[0.14em]">FAQ</h1>
      <div className="mt-10 divide-y divide-line border-y border-line">
        {faqs.map((f) => (
          <details key={f.q} className="group py-5">
            <summary className="cursor-pointer list-none font-display text-[12px] tracking-[0.12em]">
              {f.q}
            </summary>
            <p className="mt-3 font-serif text-lg text-muted">{f.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
