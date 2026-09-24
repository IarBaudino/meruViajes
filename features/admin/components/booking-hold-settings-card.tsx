"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_HOLD_WARNING,
  formatHoldHoursLabel,
} from "@/lib/checkout/hold-warning";

type BookingSettings = {
  orderHoldHours: number;
  hoursBeforeDeparture: number;
  holdWarningMessage: string;
};

export function BookingHoldSettingsCard() {
  const [settings, setSettings] = useState<BookingSettings>({
    orderHoldHours: 48,
    hoursBeforeDeparture: 2,
    holdWarningMessage: "",
  });
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
        setSettings({
          orderHoldHours: Math.max(24, Number(data.orderHoldHours) || 48),
          hoursBeforeDeparture: Math.min(
            72,
            Math.max(1, Number(data.hoursBeforeDeparture) || 2)
          ),
          holdWarningMessage:
            typeof data.holdWarningMessage === "string" ? data.holdWarningMessage : "",
        });
      } catch {
        setError("No se pudo cargar la configuración de plazos");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const livePreview = useMemo(() => {
    const template = settings.holdWarningMessage.trim() || DEFAULT_HOLD_WARNING;
    const label = formatHoldHoursLabel(settings.orderHoldHours);
    return template.replaceAll("{horas}", label).replaceAll("{hours}", label);
  }, [settings.holdWarningMessage, settings.orderHoldHours]);

  async function save() {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/admin/booking-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "No se pudo guardar");
        return;
      }
      setSettings({
        orderHoldHours: json.orderHoldHours ?? settings.orderHoldHours,
        hoursBeforeDeparture: json.hoursBeforeDeparture ?? settings.hoursBeforeDeparture,
        holdWarningMessage: json.holdWarningMessage ?? settings.holdWarningMessage,
      });
      setMessage("Guardado.");
    } catch {
      setError("Error de red al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mb-8 rounded-xl border border-meru-border bg-white p-5 sm:p-6 space-y-5">
      <div>
        <h2 className="text-base font-semibold text-meru-charcoal">
          Plazo para pagar una reserva
        </h2>
        <p className="mt-1 text-sm text-meru-muted">
          Si no pagan a tiempo, la reserva se cancela y el cupo del turno vuelve a estar libre.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-meru-muted">Cargando…</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Input
                label="Máximo después de reservar (horas)"
                type="number"
                min={24}
                max={336}
                step={24}
                value={settings.orderHoldHours}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    orderHoldHours: Number(e.target.value),
                  }))
                }
              />
              <p className="mt-1 text-xs text-meru-muted">
                Tope general. Ej.: 24 = 1 día, 48 = 2 días.
              </p>
            </div>
            <div>
              <Input
                label="Horas antes de la salida"
                type="number"
                min={1}
                max={72}
                value={settings.hoursBeforeDeparture}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    hoursBeforeDeparture: Number(e.target.value),
                  }))
                }
              />
              <p className="mt-1 text-xs text-meru-muted">
                Siempre se libera el cupo esta cantidad de horas antes del turno. Ej.: salida 9:00
                y valor 2 → si no pagó, cae a las 7:00.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Textarea
              label="Texto de aviso al cliente (opcional)"
              rows={3}
              placeholder={DEFAULT_HOLD_WARNING}
              value={settings.holdWarningMessage}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  holdWarningMessage: e.target.value,
                }))
              }
            />
            <p className="text-xs text-meru-muted">
              Usá <code className="text-meru-charcoal">{"{horas}"}</code> para el plazo (ej. “1 día”
              o “48 horas”). Si está vacío, se usa el mensaje por defecto.
            </p>
            <div className="rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-sm text-amber-950">
              <p className="text-xs font-medium uppercase tracking-wide text-amber-800">
                Vista previa
              </p>
              <p className="mt-1">{livePreview}</p>
            </div>
          </div>

          <Button type="button" onClick={() => void save()} isLoading={saving}>
            Guardar
          </Button>
        </>
      )}

      {message ? (
        <p className="flex items-start gap-2 text-sm text-green-700" role="status">
          <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="flex items-start gap-2 text-sm text-red-600" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {error}
        </p>
      ) : null}
    </section>
  );
}
