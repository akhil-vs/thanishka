"use client";

import Link from "next/link";
import {
  BadgePercent,
  ImageIcon,
  LayoutDashboard,
  Package,
  Sparkles,
  Warehouse,
} from "lucide-react";
import { BackofficeShell } from "@/components/backoffice/BackofficeShell";

const links = [
  { href: "/studio", label: "Floor", icon: LayoutDashboard, exact: true },
  { href: "/studio/stock", label: "Stock", icon: Warehouse },
  { href: "/studio/products", label: "Products", icon: Package },
  { href: "/studio/discounts", label: "Discounts", icon: BadgePercent },
  { href: "/studio/offers", label: "Offers", icon: Sparkles },
  { href: "/studio/hero", label: "Hero", icon: ImageIcon },
];

export function StudioShell({
  children,
  userName,
}: {
  children: React.ReactNode;
  userName: string;
}) {
  return (
    <BackofficeShell
      variant="studio"
      userName={userName}
      basePath="/studio"
      eyebrow="Thanishka · Boutique"
      title="Studio"
      roleLabel="Shop owner / staff"
      logoutPath="/api/auth/staff/logout"
      loginPath="/studio/login"
      links={links}
      footerNote={
        <>
          Platform controls stay in{" "}
          <Link href="/admin" className="text-kasavu-deep underline-offset-2 hover:underline">
            Admin
          </Link>
          .
        </>
      }
    >
      {children}
    </BackofficeShell>
  );
}
