import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { getAdminFirestore } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

type DepartureRow = {
  title: string;
  date: string;
  time: string;
  label?: string;
};

function normalize(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function extractDepartures(items: unknown[]): {
  departures: DepartureRow[];
  hasManualPackage: boolean;
  searchableText: string;
} {
  const departures: DepartureRow[] = [];
  let hasManualPackage = false;
  const bits: string[] = [];

  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    const row = item as {
      serviceTitle?: string;
      packageTitle?: string;
      packageId?: string;
      fulfillmentMode?: string;
      stayFrom?: string;
      stayTo?: string;
      departureDate?: string;
      departureTime?: string;
      includedDepartures?: Array<{
        serviceTitle?: string;
        departureDate?: string;
        departureTime?: string;
      }>;
    };

    if (row.serviceTitle) bits.push(row.serviceTitle);
    if (row.packageTitle) bits.push(row.packageTitle);

    if (row.packageId || row.packageTitle || row.fulfillmentMode === "manual") {
      if (row.fulfillmentMode === "manual") hasManualPackage = true;
      if (row.stayFrom && row.stayTo) {
        const from = row.stayFrom.split("-").reverse().join("/");
        const to = row.stayTo.split("-").reverse().join("/");
        departures.push({
          title: String(row.packageTitle || row.serviceTitle || "Paquete"),
          date: row.stayFrom,
          time: "00:00",
          label: `Estadía ${from} → ${to}`,
        });
      }
      continue;
    }

    if (Array.isArray(row.includedDepartures) && row.includedDepartures.length > 0) {
      for (const leg of row.includedDepartures) {
        if (leg.departureDate && leg.departureTime) {
          departures.push({
            title: String(leg.serviceTitle ?? row.serviceTitle ?? "Ítem"),
            date: leg.departureDate,
            time: leg.departureTime,
          });
        }
      }
    } else if (row.departureDate && row.departureTime) {
      departures.push({
        title: String(row.serviceTitle ?? "Ítem"),
        date: row.departureDate,
        time: row.departureTime,
      });
    }
  }

  return {
    departures,
    hasManualPackage,
    searchableText: bits.join(" "),
  };
}

function isPastOrder(departures: DepartureRow[], createdAt: Date | null): boolean {
  const today = new Date();
  const todayYmd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  if (departures.length > 0) {
    return departures.every((d) => d.date < todayYmd);
  }
  if (!createdAt) return false;
  const ageMs = Date.now() - createdAt.getTime();
  return ageMs > 45 * 24 * 60 * 60 * 1000;
}

export async function GET(request: Request) {
  const auth = await requireAdminApi(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const db = getAdminFirestore();
  if (!db) {
    return NextResponse.json({ error: "Servidor no configurado" }, { status: 503 });
  }

  const url = new URL(request.url);
  const q = normalize(url.searchParams.get("q") ?? "");
  const status = String(url.searchParams.get("status") ?? "all").toLowerCase();
  const archivedParam = String(url.searchParams.get("archived") ?? "0");
  const limitRaw = Number(url.searchParams.get("limit") ?? "250");
  const fetchLimit = Number.isFinite(limitRaw)
    ? Math.min(Math.max(limitRaw, 50), 500)
    : 250;

  const snapshot = await db
    .collection("orders")
    .orderBy("createdAt", "desc")
    .limit(fetchLimit)
    .get();

  const mapped = snapshot.docs.map((doc) => {
    const data = doc.data();
    const orderDate = data.orderDate?.toDate?.() ?? data.orderDate;
    const createdAt = data.createdAt?.toDate?.() ?? data.createdAt;
    const createdAtDate = createdAt instanceof Date ? createdAt : null;
    const items = Array.isArray(data.items) ? data.items : [];
    const { departures, hasManualPackage, searchableText } = extractDepartures(items);
    const paymentStatus = String(data.paymentStatus ?? "pendiente");
    const archived = data.archived === true;
    const past = isPastOrder(departures, createdAtDate);

    return {
      id: doc.id,
      userId: data.userId ?? "",
      total: data.total ?? 0,
      paymentStatus,
      paymentMethod: data.paymentMethod ?? "coordinar",
      customerName: data.customerName ?? "",
      customerEmail: data.customerEmail ?? "",
      customerPhone: data.customerPhone ?? "",
      customerDni: data.customerDni ?? "",
      itemCount: items.length,
      departures,
      hasManualPackage,
      archived,
      past,
      canArchive: paymentStatus !== "pendiente",
      holdExpiresAt: (() => {
        const raw = data.holdExpiresAt;
        if (raw?.toDate?.() instanceof Date) return raw.toDate().toISOString();
        if (raw instanceof Date) return raw.toISOString();
        if (raw && typeof raw === "object" && "seconds" in raw) {
          const seconds = Number((raw as { seconds: unknown }).seconds);
          if (Number.isFinite(seconds)) return new Date(seconds * 1000).toISOString();
        }
        if (typeof raw === "string") {
          const d = new Date(raw);
          if (!Number.isNaN(d.getTime())) return d.toISOString();
        }
        return null;
      })(),
      orderDate: orderDate instanceof Date ? orderDate.toISOString() : null,
      createdAt: createdAtDate ? createdAtDate.toISOString() : null,
      _search: normalize(
        [
          doc.id,
          data.customerName,
          data.customerEmail,
          data.customerPhone,
          data.customerDni,
          searchableText,
        ].join(" ")
      ),
    };
  });

  let filtered = mapped;

  if (archivedParam === "1" || archivedParam === "true") {
    filtered = filtered.filter((o) => o.archived);
  } else if (archivedParam === "all") {
    // sin filtro
  } else {
    filtered = filtered.filter((o) => !o.archived);
  }

  if (status === "pendiente" || status === "pagado" || status === "cancelado") {
    filtered = filtered.filter((o) => o.paymentStatus === status);
  } else if (status === "pasadas") {
    filtered = filtered.filter(
      (o) => o.past && (o.paymentStatus === "pagado" || o.paymentStatus === "cancelado")
    );
  }

  if (q) {
    filtered = filtered.filter((o) => o._search.includes(q));
  }

  const orders = filtered.map((row) => {
    const { _search: _ignored, ...rest } = row;
    void _ignored;
    return rest;
  });

  return NextResponse.json(
    {
      orders,
      meta: {
        fetched: mapped.length,
        returned: orders.length,
        archivedCount: mapped.filter((o) => o.archived).length,
        activeCount: mapped.filter((o) => !o.archived).length,
      },
    },
    {
      headers: { "Cache-Control": "no-store" },
    }
  );
}
