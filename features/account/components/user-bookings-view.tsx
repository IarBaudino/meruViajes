"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Booking = {
  id: string;
  serviceTitle: string;
  bookingDate: string | null;
  quantity?: number;
  active: boolean;
};

export function UserBookingsView() {
  const searchParams = useSearchParams();
  const justReserved = searchParams.get("reserva") === "ok";
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/users/me/orders");
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings ?? []);
      }
      setLoading(false);
    }
    void load();
  }, []);

  return (
    <div>
      <PageHeader title="Reservas" description="Excursiones que reservaste." />

      {justReserved ? (
        <p className="mb-6 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          <CheckCircle className="h-4 w-4 shrink-0" aria-hidden />
          Reserva confirmada. Revisá tu email; te contactaremos para coordinar el pago.
        </p>
      ) : null}

      {loading ? <p className="text-meru-muted">Cargando…</p> : null}

      {!loading && bookings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-meru-border bg-white p-10 text-center">
          <p className="text-meru-charcoal">No tenés reservas activas.</p>
          <Link href="/excursiones" className="mt-4 inline-block">
            <Button>Reservar una excursión</Button>
          </Link>
        </div>
      ) : null}

      <ul className="space-y-4">
        {bookings.map((booking) => (
          <li key={booking.id} className="rounded-xl border border-meru-border bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-meru-charcoal">{booking.serviceTitle}</p>
                <p className="text-sm text-meru-muted">
                  {booking.quantity && booking.quantity > 1
                    ? `${booking.quantity} lugares · `
                    : ""}
                  {booking.bookingDate
                    ? new Date(booking.bookingDate).toLocaleDateString("es-AR")
                    : "Fecha a confirmar"}
                </p>
              </div>
              <Badge
                className={
                  booking.active ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600"
                }
              >
                {booking.active ? "Activa" : "Cancelada"}
              </Badge>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
