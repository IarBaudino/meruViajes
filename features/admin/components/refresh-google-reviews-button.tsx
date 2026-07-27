"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  /** Place ID actual del formulario (puede no estar guardado aún). */
  placeId?: string;
};

export function RefreshGoogleReviewsButton({ placeId = "" }: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function refresh() {
    setLoading(true);
    setMessage("");
    setError("");

    const trimmed = placeId.trim();
    if (!trimmed) {
      setError("Pegá el Place ID arriba y guardá el contenido web.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/google-reviews/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeId: trimmed }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "No se pudo refrescar");
        return;
      }
      setMessage(
        `Listo: ${json.cache?.reviews?.length ?? 0} reseñas actualizadas. Recargá la home.`
      );
    } catch {
      setError("Error de red al refrescar reseñas");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="outline" isLoading={loading} onClick={() => void refresh()}>
        Actualizar reseñas desde Google
      </Button>
      {message ? <p className="text-sm text-green-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
