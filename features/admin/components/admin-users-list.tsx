"use client";

import { Fragment, useEffect, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle, AlertCircle, KeyRound, Mail, ChevronDown, ChevronUp } from "lucide-react";
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
  dni: string;
  phone: string;
  address: string;
  image: string;
  active: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  authExists: boolean;
  authProviderLabels: string[];
  hasPasswordLogin: boolean;
  emailVerified: boolean;
  authDisabled: boolean;
  lastSignInAt: string | null;
  authCreatedAt: string | null;
};

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("es-AR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return "—";
  }
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid gap-0.5 sm:grid-cols-[140px_1fr] sm:gap-3">
      <dt className="text-xs font-medium uppercase tracking-wide text-meru-muted">{label}</dt>
      <dd className="text-sm text-meru-charcoal break-words">{value || "—"}</dd>
    </div>
  );
}

function UserDetailPanel({
  user,
  onReload,
}: {
  user: AdminUser;
  onReload: () => void;
}) {
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
    onReload();
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
    <div className="mt-2 space-y-5 rounded-lg border border-meru-border bg-meru-sand/40 p-4">
      <div>
        <h3 className="text-sm font-semibold text-meru-charcoal">Datos del perfil</h3>
        <dl className="mt-3 space-y-2.5">
          <DetailRow label="UID" value={<span className="font-mono text-xs">{user.uid}</span>} />
          <DetailRow label="Nombre" value={user.name} />
          <DetailRow label="Email" value={user.email} />
          <DetailRow label="DNI / Pasaporte" value={user.dni} />
          <DetailRow label="Teléfono" value={user.phone} />
          <DetailRow label="Dirección" value={user.address} />
          <DetailRow
            label="Foto"
            value={
              user.image ? (
                <a
                  href={user.image}
                  target="_blank"
                  rel="noreferrer"
                  className="text-meru-secondary hover:underline"
                >
                  Ver imagen
                </a>
              ) : (
                "—"
              )
            }
          />
          <DetailRow
            label="Estado perfil"
            value={user.active ? "Activo" : "Inactivo"}
          />
          <DetailRow label="Rol" value={user.role === "admin" ? "Admin" : "Cliente"} />
          <DetailRow label="Alta en app" value={formatDateTime(user.createdAt)} />
          <DetailRow label="Última edición" value={formatDateTime(user.updatedAt)} />
        </dl>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-meru-charcoal">Autenticación (Firebase)</h3>
        <dl className="mt-3 space-y-2.5">
          <DetailRow
            label="Cuenta Auth"
            value={user.authExists ? "Existe" : "No encontrada"}
          />
          <DetailRow
            label="Métodos"
            value={
              user.authProviderLabels.length > 0
                ? user.authProviderLabels.join(", ")
                : "—"
            }
          />
          <DetailRow
            label="Email/contraseña"
            value={user.hasPasswordLogin ? "Sí" : "No (solo Google u otro)"}
          />
          <DetailRow
            label="Email verificado"
            value={user.emailVerified ? "Sí" : "No"}
          />
          <DetailRow
            label="Auth deshabilitada"
            value={user.authDisabled ? "Sí" : "No"}
          />
          <DetailRow label="Creada en Auth" value={formatDateTime(user.authCreatedAt)} />
          <DetailRow label="Último acceso" value={formatDateTime(user.lastSignInAt)} />
        </dl>
      </div>

      <div className="border-t border-meru-border pt-4 space-y-4">
        <p className="text-sm text-meru-charcoal">
          <strong>Gestión de contraseña</strong>
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
            <Button
              type="button"
              size="sm"
              variant="outline"
              isLoading={busyReset}
              onClick={() => void sendReset()}
            >
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
        description="Perfil completo de cada cuenta: contacto, documento y acceso."
      />

      <p className="mb-6 text-sm text-meru-muted">
        Abrí <strong>Ver detalle</strong> para ver DNI, teléfono, dirección y datos de Auth. Las
        contraseñas no se pueden ver una vez guardadas.
      </p>

      {loading ? <p className="text-meru-muted">Cargando…</p> : null}

      {!loading && users.length === 0 ? (
        <p className="text-meru-muted">No hay usuarios registrados todavía.</p>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-meru-border bg-white">
        <table className="min-w-full text-sm">
          <thead className="border-b border-meru-border bg-meru-sand/50 text-left text-meru-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Contacto</th>
              <th className="px-4 py-3 font-medium">Documento</th>
              <th className="px-4 py-3 font-medium">Acceso</th>
              <th className="px-4 py-3 font-medium">Rol</th>
              <th className="px-4 py-3 font-medium">Alta</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const open = openUid === user.uid;
              return (
                <Fragment key={user.uid}>
                  <tr className="border-b border-meru-border/60 align-top">
                    <td className="px-4 py-3 text-meru-charcoal">
                      <p className="font-medium">{user.name || "—"}</p>
                      {!user.active ? (
                        <Badge className="mt-1 bg-red-50 text-red-700">Inactivo</Badge>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <p>{user.email || "—"}</p>
                      <p className="mt-0.5 text-xs text-meru-muted">
                        {user.phone || "Sin teléfono"}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-meru-charcoal">
                      {user.dni || <span className="text-meru-muted">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-meru-muted">
                      {user.authProviderLabels.length > 0
                        ? user.authProviderLabels.join(", ")
                        : "—"}
                      {user.lastSignInAt ? (
                        <p className="mt-1">Último: {formatDateTime(user.lastSignInAt)}</p>
                      ) : null}
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
                    <td className="px-4 py-3 text-xs text-meru-muted whitespace-nowrap">
                      {formatDateTime(user.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setOpenUid(open ? null : user.uid)}
                      >
                        {open ? (
                          <>
                            <ChevronUp className="h-4 w-4" aria-hidden />
                            Cerrar
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4" aria-hidden />
                            Ver detalle
                          </>
                        )}
                      </Button>
                    </td>
                  </tr>
                  {open ? (
                    <tr>
                      <td colSpan={7} className="px-4 pb-4">
                        <UserDetailPanel user={user} onReload={() => void load()} />
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
