"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  Settings2,
  Store,
  Users,
} from "lucide-react";
import { BackofficeShell } from "@/components/backoffice/BackofficeShell";

const links = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/access", label: "Access", icon: Users },
  { href: "/admin/shop", label: "Boutique", icon: Store },
  { href: "/admin/system", label: "System", icon: Settings2 },
];

export function AdminShell({
  children,
  adminName,
}: {
  children: React.ReactNode;
  adminName: string;
}) {
  return (
    <BackofficeShell
      variant="admin"
      userName={adminName}
      basePath="/admin"
      eyebrow="Thanishka · Platform"
      title="Admin"
      roleLabel="Platform admin"
      logoutPath="/api/admin/auth/logout"
      loginPath="/admin/login"
      links={links}
      footerNote={
        <>
          Day-to-day stock & catalogue live in{" "}
          <Link href="/studio" className="text-kasavu underline-offset-2 hover:underline">
            Studio
          </Link>
          .
        </>
      }
    >
      {children}
    </BackofficeShell>
  );
}
