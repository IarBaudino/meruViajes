import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { couponSchema } from "@/schemas/coupon";
import {
  couponToFirestore,
  mapFirestoreCoupon,
  COUPONS_COLLECTION,
  normalizeCouponCode,
} from "@/features/coupons/lib/firestore-mapper";
import { getCouponByIdAdmin } from "@/features/coupons/lib/get-coupons";

const activeToggleSchema = z.object({ active: z.boolean() });

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const auth = await requireAdminApi(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id } = await context.params;
  const coupon = await getCouponByIdAdmin(id);
  if (!coupon) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json({ coupon });
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

  const docRef = db.collection(COUPONS_COLLECTION).doc(id);
  const doc = await docRef.get();
  if (!doc.exists) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const toggleOnly = activeToggleSchema.safeParse(body);
  if (toggleOnly.success && Object.keys(body).length === 1) {
    await docRef.set({ active: toggleOnly.data.active, updatedAt: new Date() }, { merge: true });
    return NextResponse.json({
      coupon: mapFirestoreCoupon(id, (await docRef.get()).data()!),
    });
  }

  const parsed = couponSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const code = normalizeCouponCode(parsed.data.code);
  const slugConflict = await db.collection(COUPONS_COLLECTION).where("code", "==", code).get();
  if (slugConflict.docs.some((d) => d.id !== id)) {
    return NextResponse.json({ error: "Ya existe otro cupón con ese código" }, { status: 409 });
  }

  const current = mapFirestoreCoupon(id, doc.data()!);
  await docRef.set(
    {
      ...couponToFirestore({ ...parsed.data, code, usedCount: current.usedCount }),
      updatedAt: new Date(),
    },
    { merge: true }
  );

  return NextResponse.json({
    coupon: mapFirestoreCoupon(id, (await docRef.get()).data()!),
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

  const docRef = db.collection(COUPONS_COLLECTION).doc(id);
  const doc = await docRef.get();
  if (!doc.exists) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  await docRef.delete();
  return NextResponse.json({ ok: true, deleted: true });
}
