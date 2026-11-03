"use client";

import { BackofficeShell } from "@/components/backoffice/BackofficeShell";

export function AdminShell({
  children,
  adminName,
}: {
  children: React.ReactNode;
  adminName: string;
}) {
  return (
    <BackofficeShell
      userName={adminName}
      basePath="/admin"
      title="Admin"
      logoutPath="/api/admin/auth/logout"
      loginPath="/admin/login"
    >
      {children}
    </BackofficeShell>
  );
}
