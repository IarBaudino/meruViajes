import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { groupTripSchema } from "@/schemas/group-trip";
import {
  mapFirestoreGroupTrip,
  groupTripToFirestore,
  GROUP_TRIPS_COLLECTION,
} from "@/features/group-trips/lib/firestore-mapper";
import { getGroupTripByIdAdmin } from "@/features/group-trips/lib/get-group-trips";
import { defaultDurationLabel } from "@/features/group-trips/lib/dates";

const activeToggleSchema = z.object({ active: z.boolean() });

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const auth = await requireAdminApi(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const trip = await getGroupTripByIdAdmin(id);
  if (!trip) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  return NextResponse.json({ trip });
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAdminApi(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const body = await request.json();
  const db = getAdminFirestore();
  if (!db) {
    return NextResponse.json({ error: "Servidor no configurado" }, { status: 503 });
  }

  const docRef = db.collection(GROUP_TRIPS_COLLECTION).doc(id);
  const doc = await docRef.get();
  if (!doc.exists) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const toggleOnly = activeToggleSchema.safeParse(body);
  if (toggleOnly.success && Object.keys(body).length === 1) {
    await docRef.set({ active: toggleOnly.data.active, updatedAt: new Date() }, { merge: true });
    revalidatePath("/viajes-grupales");
    revalidatePath("/");
    return NextResponse.json({
      trip: mapFirestoreGroupTrip(id, (await docRef.get()).data()!),
    });
  }

  const parsed = groupTripSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const slugConflict = await db
    .collection(GROUP_TRIPS_COLLECTION)
    .where("slug", "==", parsed.data.slug)
    .get();
  if (slugConflict.docs.some((d) => d.id !== id)) {
    return NextResponse.json({ error: "Ya existe otro viaje grupal con ese slug" }, { status: 409 });
  }

  const data = parsed.data;
  await docRef.set(
    {
      ...groupTripToFirestore({
        ...data,
        durationLabel: defaultDurationLabel(data.startDate, data.endDate),
      }),
      updatedAt: new Date(),
    },
    { merge: true }
  );

  revalidatePath("/viajes-grupales");
  revalidatePath(`/viajes-grupales/${parsed.data.slug}`);
  revalidatePath("/");

  return NextResponse.json({
    trip: mapFirestoreGroupTrip(id, (await docRef.get()).data()!),
  });
}

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await requireAdminApi(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const db = getAdminFirestore();
  if (!db) {
    return NextResponse.json({ error: "Servidor no configurado" }, { status: 503 });
  }

  const permanent = new URL(request.url).searchParams.get("permanent") === "true";
  const docRef = db.collection(GROUP_TRIPS_COLLECTION).doc(id);
  const doc = await docRef.get();
  if (!doc.exists) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  if (permanent) {
    await docRef.delete();
    revalidatePath("/viajes-grupales");
    revalidatePath("/");
    return NextResponse.json({ ok: true, deleted: true });
  }

  await docRef.set({ active: false, updatedAt: new Date() }, { merge: true });
  return NextResponse.json({ ok: true, deactivated: true });
}
