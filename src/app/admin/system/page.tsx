"use client";

import Link from "next/link";

const rows = [
  ["Admin session", "thanishka_admin_session", "/admin"],
  ["Staff session", "thanishka_staff_session", "/studio"],
  ["Customer session", "thanishka_customer_session", "/account"],
];

export default function AdminSystemPage() {
  return (
    <div>
      <p className="font-display text-[10px] tracking-[0.2em] text-kasavu-deep">
        Platform control
      </p>
      <h1 className="mt-2 font-display text-2xl tracking-[0.14em] md:text-3xl">
        System
      </h1>
      <p className="mt-2 max-w-xl font-serif text-muted">
        Session boundaries for the three account classes. Customer cookies never
        unlock Admin or Studio.
      </p>

      <div className="mt-8 overflow-x-auto border border-charcoal/15 bg-ivory">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-line font-display text-[10px] tracking-[0.14em] text-muted">
            <tr>
              <th className="px-4 py-3 font-normal">Audience</th>
              <th className="px-4 py-3 font-normal">Cookie</th>
              <th className="px-4 py-3 font-normal">Surface</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, cookie, href]) => (
              <tr key={cookie} className="border-b border-line last:border-0">
                <td className="px-4 py-3 font-serif">{label}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted">{cookie}</td>
                <td className="px-4 py-3">
                  <Link
                    href={href}
                    className="font-display text-[10px] tracking-[0.14em] text-kasavu-deep"
                  >
                    {href}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="mt-8 border border-charcoal/15 bg-ivory p-5">
        <h2 className="font-display text-[11px] tracking-[0.16em]">
          Responsibility split
        </h2>
        <ul className="mt-4 space-y-3 font-serif text-sm text-muted">
          <li>
            <span className="font-display text-[10px] tracking-[0.14em] text-charcoal">
              Admin
            </span>{" "}
            — access, boutique settings, system overview.
          </li>
          <li>
            <span className="font-display text-[10px] tracking-[0.14em] text-charcoal">
              Studio
            </span>{" "}
            — stock, products, discounts, offers, hero for the boutique floor.
          </li>
          <li>
            <span className="font-display text-[10px] tracking-[0.14em] text-charcoal">
              Account
            </span>{" "}
            — customer OTP/email identity and addresses.
          </li>
        </ul>
      </section>
    </div>
  );
}
