import { Suspense } from "react";
import { UserBookingsView } from "@/features/account/components/user-bookings-view";

export default function UserBookingsPage() {
  return (
    <Suspense fallback={<p className="text-brand-muted">Cargando…</p>}>
      <UserBookingsView />
    </Suspense>
  );
}
