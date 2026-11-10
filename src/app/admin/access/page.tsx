"use client";

import { useAdminResource } from "@/lib/admin/useAdminResource";

type AccessResponse = {
  users: Array<{
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    active: boolean;
    roles: Array<{
      role: string;
      shopId: string | null;
      shopName: string | null;
    }>;
  }>;
};

export default function AdminAccessPage() {
  const { data, error } = useAdminResource<AccessResponse>("/api/admin/users");

  if (error) return <p className="text-sale">{error}</p>;
  if (!data) return <p className="font-serif text-muted">Loading access…</p>;

  return (
    <div>
      <p className="font-display text-[10px] tracking-[0.2em] text-kasavu-deep">
        Platform control
      </p>
      <h1 className="mt-2 font-display text-2xl tracking-[0.14em] md:text-3xl">
        Access
      </h1>
      <p className="mt-2 max-w-xl font-serif text-muted">
        Who can sign into Admin, Studio, or the storefront account. Invites for
        extra staff land here next.
      </p>

      <div className="mt-8 overflow-x-auto border border-charcoal/15 bg-ivory">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-line font-display text-[10px] tracking-[0.14em] text-muted">
            <tr>
              <th className="px-4 py-3 font-normal">Person</th>
              <th className="px-4 py-3 font-normal">Contact</th>
              <th className="px-4 py-3 font-normal">Roles</th>
              <th className="px-4 py-3 font-normal">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.users.map((user) => (
              <tr key={user.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3 font-serif">{user.name}</td>
                <td className="px-4 py-3 font-serif text-muted">
                  {user.email ?? user.phone ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    {user.roles.map((r) => (
                      <span
                        key={`${user.id}-${r.role}-${r.shopId ?? "none"}`}
                        className="border border-line px-2 py-0.5 font-display text-[9px] tracking-[0.12em]"
                      >
                        {r.role.replaceAll("_", " ")}
                        {r.shopName ? ` · ${r.shopName}` : ""}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 font-display text-[10px] tracking-[0.12em]">
                  {user.active ? "Active" : "Disabled"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
