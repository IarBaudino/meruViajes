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
  shortHoldEnabled: boolean;
  shortHoldHours: number;
  holdWarningMessage: string;
  activeHoldHours: number;
  warningPreview: string;
};

export function BookingHoldSettingsCard() {
  const [settings, setSettings] = useState<BookingSettings>({
    orderHoldHours: 48,
    shortHoldEnabled: false,
    shortHoldHours: 2,
    holdWarningMessage: "",
    activeHoldHours: 48,
    warningPreview: "",
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
          shortHoldEnabled: Boolean(data.shortHoldEnabled),
          shortHoldHours: Math.min(23, Math.max(1, Number(data.shortHoldHours) || 2)),
          holdWarningMessage: typeof data.holdWarningMessage === "string" ? data.holdWarningMessage : "",
          activeHoldHours: Number(data.activeHoldHours) || 48,
          warningPreview: data.warningPreview ?? "",
        });
      } catch {
        setError("No se pudo cargar el tiempo de reserva");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const previewHours = settings.shortHoldEnabled
    ? settings.shortHoldHours
    : settings.orderHoldHours;

  const livePreview = useMemo(() => {
    const template = settings.holdWarningMessage.trim() || DEFAULT_HOLD_WARNING;
    const label = formatHoldHoursLabel(previewHours);
    return template.replaceAll("{horas}", label).replaceAll("{hours}", label);
  }, [settings.holdWarningMessage, previewHours]);

  async function save() {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/admin/booking-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderHoldHours: settings.orderHoldHours,
          shortHoldEnabled: settings.shortHoldEnabled,
          shortHoldHours: settings.shortHoldHours,
          holdWarningMessage: settings.holdWarningMessage,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "No se pudo guardar");
        return;
      }
      setSettings((prev) => ({
        ...prev,
        orderHoldHours: json.orderHoldHours ?? prev.orderHoldHours,
        shortHoldEnabled: Boolean(json.shortHoldEnabled),
        shortHoldHours: json.shortHoldHours ?? prev.shortHoldHours,
        holdWarningMessage: json.holdWarningMessage ?? prev.holdWarningMessage,
        activeHoldHours: json.activeHoldHours ?? prev.activeHoldHours,
        warningPreview: json.warningPreview ?? prev.warningPreview,
      }));
      setMessage("Guardado. Las próximas reservas usarán esta configuración.");
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
          Tiempo de reserva sin pago
        </h2>
        <p className="mt-1 text-sm text-meru-muted">
          Cuánto tiempo se sostiene el cupo después de reservar, hasta confirmar el pago. Si vence
          sin pagar, el cupo se libera. También podés liberarlo antes desde Órdenes.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-meru-muted">Cargando…</p>
      ) : (
        <>
          <div>
            <p className="text-sm text-meru-charcoal">
              Plazo normal: mínimo <strong>24 horas</strong> · máximo <strong>336 horas</strong>{" "}
              (14 días).
            </p>
            <div className="mt-3 sm:max-w-[200px]">
              <Input
                label="Horas (plazo normal)"
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
            </div>
          </div>

          <div className="rounded-lg border border-meru-border bg-meru-sand/40 p-4 space-y-3">
            <label className="flex items-start gap-2 text-sm text-meru-charcoal">
              <input
                type="checkbox"
                className="mt-0.5 rounded"
                checked={settings.shortHoldEnabled}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    shortHoldEnabled: e.target.checked,
                  }))
                }
              />
              <span>
                <strong>Activar plazo corto forzado</strong>. Mientras esté activo, <em>todas</em>{" "}
                las reservas nuevas usan este plazo. Si no lo activás, el plazo corto se aplica solo
                cuando la salida elegida está cerca (faltan menos horas que el plazo normal).
              </span>
            </label>
            {settings.shortHoldEnabled ? (
              <div className="sm:max-w-[200px]">
                <Input
                  label="Horas (plazo corto)"
                  type="number"
                  min={1}
                  max={23}
                  value={settings.shortHoldHours}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      shortHoldHours: Number(e.target.value),
                    }))
                  }
                />
              </div>
            ) : null}
          </div>

          <div className="space-y-2">
            <Textarea
              label="Advertencia para el cliente"
              rows={4}
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
              Escribí el texto que verá al reservar. Usá <code className="text-meru-charcoal">{"{horas}"}</code>{" "}
              para insertar el plazo vigente. Si lo dejás vacío, se usa el mensaje por defecto.
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
