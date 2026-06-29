"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Inquiry = {
  id: string;
  name: string;
  email: string;
  message: string;
  status: string;
  createdAt: string | null;
};

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/admin/inquiries");
      if (res.ok) {
        const data = await res.json();
        setInquiries(data.inquiries ?? []);
      }
      setLoading(false);
    }
    void load();
  }, []);

  async function markResponded(id: string) {
    await fetch("/api/admin/inquiries", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "respondido" }),
    });
    setInquiries((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: "respondido" } : i))
    );
  }

  return (
    <div>
      <PageHeader title="Consultas" description="Mensajes del formulario de contacto." />

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
                {inquiry.createdAt ? (
                  <p className="mt-1 text-xs text-meru-muted">
                    {new Date(inquiry.createdAt).toLocaleString("es-AR")}
                  </p>
                ) : null}
              </div>
              <Badge
                className={
                  inquiry.status === "nuevo"
                    ? "bg-amber-100 text-amber-900"
                    : "bg-green-100 text-green-800"
                }
              >
                {inquiry.status === "nuevo" ? "Nuevo" : "Respondido"}
              </Badge>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-sm text-meru-charcoal-muted">
              {inquiry.message}
            </p>
            {inquiry.status === "nuevo" ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => void markResponded(inquiry.id)}
              >
                Marcar respondido
              </Button>
            ) : null}
          </article>
        ))}
        {!loading && inquiries.length === 0 ? (
          <p className="text-meru-muted">No hay consultas todavía.</p>
        ) : null}
      </div>
    </div>
  );
}
