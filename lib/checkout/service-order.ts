/** Genera el número de orden de servicio al confirmar el pago. */
export function generateServiceOrderNumber(orderId: string, at: Date = new Date()): string {
  const y = at.getFullYear();
  const m = String(at.getMonth() + 1).padStart(2, "0");
  const d = String(at.getDate()).padStart(2, "0");
  const suffix = orderId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase() || "MERU";
  return `OS-${y}${m}${d}-${suffix}`;
}
