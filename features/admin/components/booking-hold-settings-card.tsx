"use client";

import { useEffect, useState } from "react";
import { CheckCircle, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function BookingHoldSettingsCard() {
  const [hours, setHours] = useState(48);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/booking-settings");
        if (!res.ok) throw new Error("No se pudo cargar");
        const data = await res.json();
        setHours(Number(data.orderHoldHours) || 48);
      } catch {
        setError("No se pudo cargar el tiempo de reserva");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  async function save() {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/admin/booking-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderHoldHours: hours }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "No se pudo guardar");
        return;
      }
      setHours(json.orderHoldHours ?? hours);
      setMessage("Tiempo de reserva guardado. Aplica a las reservas nuevas.");
    } catch {
      setError("Error de red al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mb-8 rounded-xl border border-meru-border bg-white p-5 sm:p-6">
      <h2 className="text-base font-semibold text-meru-charcoal">
        Tiempo de reserva sin pago
      </h2>
      <p className="mt-1 text-sm text-meru-muted">
        Al confirmar una reserva, el cupo queda sostenido este tiempo. Si no se paga, se libera
        solo (o lo liberás antes desde Órdenes).
      </p>

      {loading ? (
        <p className="mt-4 text-sm text-meru-muted">Cargando…</p>
      ) : (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="sm:max-w-[200px]">
            <Input
              label="Horas"
              type="number"
              min={1}
              max={336}
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
            />
          </div>
          <Button type="button" onClick={() => void save()} isLoading={saving}>
            Guardar
          </Button>
        </div>
      )}

      <p className="mt-2 text-xs text-meru-muted">
        Ej.: 24 = 1 día · 48 = 2 días · 72 = 3 días. Máximo 336 (14 días).
      </p>

      {message ? (
        <p className="mt-3 flex items-start gap-2 text-sm text-green-700" role="status">
          <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mt-3 flex items-start gap-2 text-sm text-red-600" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {error}
        </p>
      ) : null}
    </section>
  );
}
