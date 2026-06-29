"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";

type AdminUser = {
  uid: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string | null;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users ?? []);
      }
      setLoading(false);
    }
    void load();
  }, []);

  return (
    <div>
      <PageHeader title="Usuarios" description="Cuentas registradas en la plataforma." />

      {loading ? <p className="text-meru-muted">Cargando…</p> : null}

      <div className="overflow-x-auto rounded-xl border border-meru-border bg-white">
        <table className="min-w-full text-sm">
          <thead className="border-b border-meru-border bg-meru-sand/50 text-left text-meru-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Rol</th>
              <th className="px-4 py-3 font-medium">Registro</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.uid} className="border-b border-meru-border/60 last:border-0">
                <td className="px-4 py-3 text-meru-charcoal">{user.name || "—"}</td>
                <td className="px-4 py-3">{user.email}</td>
                <td className="px-4 py-3">
                  <Badge
                    className={
                      user.role === "admin"
                        ? "bg-meru-ice text-meru-primary"
                        : "bg-slate-100 text-slate-600"
                    }
                  >
                    {user.role === "admin" ? "Admin" : "Cliente"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-meru-muted">
                  {user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString("es-AR")
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
