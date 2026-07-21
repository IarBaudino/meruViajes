import { redirect } from "next/navigation";

/** Unificado: pedidos pendientes viven en Carrito; pagados en Reservas. */
export default function UserOrdersRedirectPage() {
  redirect("/mi-cuenta/reservas");
}
