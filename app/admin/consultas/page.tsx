"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Inquiry = {
  id: string;
  name: string;
  email: string;
  message: string;
  relatedKind?: string | null;
  relatedSlug?: string | null;
  relatedTitle?: string | null;
  status: string;
  archived?: boolean;
  createdAt: string | null;
};

type ArchiveView = "active" | "archived";

function relatedLabel(kind?: string | null) {
  if (kind === "package") return "Paquete";
  if (kind === "excursion") return "Excursión";
  return "Consulta sobre";
}

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [archiveView, setArchiveView] = useState<ArchiveView>("active");
  const [meta, setMeta] = useState({ activeCount: 0, archivedCount: 0 });

  const load = useCallback(async () => {
    setLoading(true);
    setActionError("");
    try {
      const params = new URLSearchParams({
        archived: archiveView === "archived" ? "1" : "0",
      });
      const res = await fetch(`/api/admin/inquiries?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setInquiries(data.inquiries ?? []);
        setMeta({
          activeCount: Number(data.meta?.activeCount ?? 0),
          archivedCount: Number(data.meta?.archivedCount ?? 0),
        });
      } else {
        setActionError("No se pudieron cargar las consultas.");
      }
    } finally {
      setLoading(false);
    }
  }, [archiveView]);

  useEffect(() => {
    void load();
  }, [load]);

  async function markResponded(id: string) {
    setBusyId(id);
    setActionError("");
    try {
      const res = await fetch("/api/admin/inquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "respondido" }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setActionError(json.error ?? "No se pudo actualizar");
        return;
      }
      setInquiries((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: "respondido" } : i))
      );
    } finally {
      setBusyId(null);
    }
  }

  async function setArchived(id: string, archived: boolean) {
    setActionError("");
    const msg = archived
      ? "¿Archivar esta consulta respondida? Se oculta del listado principal."
      : "¿Restaurar esta consulta al listado principal?";
    if (!confirm(msg)) return;

    setBusyId(id);
    try {
      const res = await fetch("/api/admin/inquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, archived }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setActionError(json.error ?? "No se pudo archivar");
        return;
      }
      await load();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <PageHeader title="Consultas" description="Mensajes del formulario de contacto." />

      <div className="mb-6 flex flex-wrap gap-2">
        {(
          [
            ["active", `Activas (${meta.activeCount})`],
            ["archived", `Archivadas (${meta.archivedCount})`],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setArchiveView(value)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              archiveView === value
                ? "bg-meru-primary text-white"
                : "bg-meru-ice text-meru-charcoal hover:bg-meru-border/60"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {actionError ? (
        <p className="mb-4 text-sm text-red-600" role="alert">
          {actionError}
        </p>
      ) : null}

      {loading ? <p className="text-meru-muted">Cargando…</p> : null}

      <div className="space-y-4">
        {inquiries.map((inquiry) => (
          <article
            key={inquiry.id}
            className="rounded-xl border border-meru-border bg-white p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-meru-charcoal">{inquiry.name}</p>
                <a
                  href={`mailto:${inquiry.email}`}
                  className="text-sm text-meru-secondary hover:underline"
                >
                  {inquiry.email}
                </a>
                {inquiry.relatedTitle || inquiry.relatedSlug ? (
                  <p className="mt-2 text-sm font-medium text-meru-primary">
                    {relatedLabel(inquiry.relatedKind)}:{" "}
                    {inquiry.relatedTitle || inquiry.relatedSlug}
                    {inquiry.relatedSlug && inquiry.relatedKind === "excursion" ? (
                      <>
                        {" · "}
                        <a
                          href={`/excursiones/${inquiry.relatedSlug}`}
                          className="font-normal text-meru-secondary hover:underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          ver ficha
                        </a>
                      </>
                    ) : null}
                    {inquiry.relatedSlug && inquiry.relatedKind === "package" ? (
                      <>
                        {" · "}
                        <a
                          href={`/paquetes/${inquiry.relatedSlug}`}
                          className="font-normal text-meru-secondary hover:underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          ver ficha
                        </a>
                      </>
                    ) : null}
                  </p>
                ) : null}
                {inquiry.createdAt ? (
                  <p className="mt-1 text-xs text-meru-muted">
                    {new Date(inquiry.createdAt).toLocaleString("es-AR")}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  className={
                    inquiry.status === "nuevo"
                      ? "bg-amber-100 text-amber-900"
                      : "bg-green-100 text-green-800"
                  }
                >
                  {inquiry.status === "nuevo" ? "Nuevo" : "Respondido"}
                </Badge>
                {inquiry.archived ? (
                  <Badge className="bg-slate-100 text-slate-600">Archivada</Badge>
                ) : null}
              </div>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-sm text-meru-charcoal-muted">
              {inquiry.message}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {inquiry.status === "nuevo" && !inquiry.archived ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={busyId === inquiry.id}
                  onClick={() => void markResponded(inquiry.id)}
                >
                  Marcar respondido
                </Button>
              ) : null}
              {inquiry.status === "respondido" && !inquiry.archived ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={busyId === inquiry.id}
                  onClick={() => void setArchived(inquiry.id, true)}
                >
                  Archivar
                </Button>
              ) : null}
              {inquiry.archived ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={busyId === inquiry.id}
                  onClick={() => void setArchived(inquiry.id, false)}
                >
                  Restaurar
                </Button>
              ) : null}
            </div>
          </article>
        ))}
        {!loading && inquiries.length === 0 ? (
          <p className="text-meru-muted">
            {archiveView === "archived"
              ? "No hay consultas archivadas."
              : "No hay consultas activas."}
          </p>
        ) : null}
      </div>
    </div>
  );
}
