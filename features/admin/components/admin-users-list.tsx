"use client";

import { Fragment, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle, AlertCircle, KeyRound, Mail } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { adminSetPasswordSchema, type AdminSetPasswordFormData } from "@/schemas/auth";

type AdminUser = {
  uid: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string | null;
  authProviderLabels: string[];
  hasPasswordLogin: boolean;
};

function SetPasswordPanel({ user, onDone }: { user: AdminUser; onDone: () => void }) {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [resetLink, setResetLink] = useState<string | null>(null);
  const [busyReset, setBusyReset] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AdminSetPasswordFormData>({
    resolver: zodResolver(adminSetPasswordSchema),
  });

  async function onSubmit(data: AdminSetPasswordFormData) {
    setStatus("idle");
    setMessage("");

    const res = await fetch(`/api/admin/users/${user.uid}/password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: data.password }),
    });
    const json = await res.json();

    if (!res.ok) {
      setStatus("error");
      setMessage(json.error ?? "No se pudo asignar la contraseña");
      return;
    }

    reset();
    setStatus("success");
    setMessage(
      "Contraseña asignada. Copiala ahora y compartila de forma segura con el usuario; no podrás verla después."
    );
    onDone();
  }

  async function sendReset() {
    setBusyReset(true);
    setResetLink(null);
    setMessage("");

    const res = await fetch(`/api/admin/users/${user.uid}/password-reset`, {
      method: "POST",
    });
    const json = await res.json();
    setBusyReset(false);

    if (!res.ok) {
      setStatus("error");
      setMessage(json.error ?? "No se pudo enviar el enlace");
      return;
    }

    setStatus("success");
    if (json.emailed) {
      setMessage(`Enlace de restablecimiento enviado a ${user.email}.`);
    } else if (json.resetLink) {
      setResetLink(json.resetLink);
      setMessage("Copiá este enlace y enviáselo al usuario (expira pronto):");
    }
  }

  return (
    <div className="mt-4 rounded-lg border border-meru-border bg-meru-sand/40 p-4 space-y-4">
      <p className="text-sm text-meru-charcoal">
        <strong>{user.name || user.email}</strong>
        {!user.hasPasswordLogin ? (
          <span className="block text-xs text-meru-muted mt-1">
            Esta cuenta entró con Google. Asigná una contraseña para que pueda ingresar con email.
          </span>
        ) : null}
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3 sm:grid-cols-2">
        <PasswordInput
          label="Nueva contraseña"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register("password")}
        />
        <PasswordInput
          label="Confirmar"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />
        <div className="sm:col-span-2 flex flex-wrap gap-2">
          <Button type="submit" size="sm" isLoading={isSubmitting}>
            <KeyRound className="h-4 w-4" aria-hidden />
            Asignar contraseña
          </Button>
          <Button type="button" size="sm" variant="outline" isLoading={busyReset} onClick={() => void sendReset()}>
            <Mail className="h-4 w-4" aria-hidden />
            Enviar enlace por email
          </Button>
        </div>
      </form>

      {message ? (
        <p
          className={`flex items-start gap-2 text-sm ${status === "error" ? "text-red-600" : "text-green-700"}`}
          role={status === "error" ? "alert" : "status"}
        >
          {status === "error" ? (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          ) : (
            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          )}
          {message}
        </p>
      ) : null}

      {resetLink ? (
        <p className="break-all rounded border border-meru-border bg-white p-2 text-xs font-mono text-meru-charcoal">
          {resetLink}
        </p>
      ) : null}
    </div>
  );
}

export function AdminUsersList() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [openUid, setOpenUid] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/users");
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div>
      <PageHeader
        title="Usuarios"
        description="Cuentas registradas. Podés asignar contraseñas para que prueben el acceso con email."
      />

      <p className="mb-6 text-sm text-meru-muted">
        Las contraseñas <strong>no se pueden ver</strong> una vez guardadas. Si entraste con Google, la
        contraseña de Gmail <strong>no es la de Meru</strong> hasta que crees o asignes una acá.
      </p>

      {loading ? <p className="text-meru-muted">Cargando…</p> : null}

      <div className="overflow-x-auto rounded-xl border border-meru-border bg-white">
        <table className="min-w-full text-sm">
          <thead className="border-b border-meru-border bg-meru-sand/50 text-left text-meru-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Acceso</th>
              <th className="px-4 py-3 font-medium">Rol</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <Fragment key={user.uid}>
                <tr className="border-b border-meru-border/60">
                  <td className="px-4 py-3 text-meru-charcoal">{user.name || "—"}</td>
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3 text-xs text-meru-muted">
                    {user.authProviderLabels.length > 0
                      ? user.authProviderLabels.join(", ")
                      : "—"}
                  </td>
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
                  <td className="px-4 py-3">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setOpenUid(openUid === user.uid ? null : user.uid)}
                    >
                      {openUid === user.uid ? "Cerrar" : "Contraseña"}
                    </Button>
                  </td>
                </tr>
                {openUid === user.uid ? (
                  <tr>
                    <td colSpan={5} className="px-4 pb-4">
                      <SetPasswordPanel user={user} onDone={() => void load()} />
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
