"use client";

import { BackofficeShell } from "@/components/backoffice/BackofficeShell";

export function StudioShell({
  children,
  userName,
}: {
  children: React.ReactNode;
  userName: string;
}) {
  return (
    <BackofficeShell
      userName={userName}
      basePath="/studio"
      title="Studio"
      logoutPath="/api/auth/staff/logout"
      loginPath="/studio/login"
    >
      {children}
    </BackofficeShell>
  );
}
