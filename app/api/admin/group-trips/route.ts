import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { groupTripSchema } from "@/schemas/group-trip";
import {
  groupTripToFirestore,
  GROUP_TRIPS_COLLECTION,
} from "@/features/group-trips/lib/firestore-mapper";
import { getAllGroupTripsAdmin } from "@/features/group-trips/lib/get-group-trips";
import { defaultDurationLabel } from "@/features/group-trips/lib/dates";

export async function GET(request: Request) {
  const auth = await requireAdminApi(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const trips = await getAllGroupTripsAdmin();
  return NextResponse.json({ trips });
}

export async function POST(request: Request) {
  const auth = await requireAdminApi(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json();
  const parsed = groupTripSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const db = getAdminFirestore();
  if (!db) {
    return NextResponse.json({ error: "Servidor no configurado" }, { status: 503 });
  }

  const existing = await db
    .collection(GROUP_TRIPS_COLLECTION)
    .where("slug", "==", parsed.data.slug)
    .limit(1)
    .get();

  if (!existing.empty) {
    return NextResponse.json({ error: "Ya existe un viaje grupal con ese slug" }, { status: 409 });
  }

  const data = parsed.data;
  const ref = await db.collection(GROUP_TRIPS_COLLECTION).add({
    ...groupTripToFirestore({
      ...data,
      durationLabel: defaultDurationLabel(data.startDate, data.endDate),
      stock: data.capacity,
    }),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  revalidatePath("/viajes-grupales");
  revalidatePath("/");

  return NextResponse.json({ id: ref.id }, { status: 201 });
}
