import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { couponSchema } from "@/schemas/coupon";
import {
  couponToFirestore,
  COUPONS_COLLECTION,
  normalizeCouponCode,
} from "@/features/coupons/lib/firestore-mapper";
import { getAllCouponsAdmin } from "@/features/coupons/lib/get-coupons";

export async function GET(request: Request) {
  const auth = await requireAdminApi(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const coupons = await getAllCouponsAdmin();
  return NextResponse.json({ coupons });
}

export async function POST(request: Request) {
  const auth = await requireAdminApi(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json();
  const parsed = couponSchema.safeParse(body);
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

  const code = normalizeCouponCode(parsed.data.code);
  const existing = await db.collection(COUPONS_COLLECTION).where("code", "==", code).limit(1).get();
  if (!existing.empty) {
    return NextResponse.json({ error: "Ya existe un cupón con ese código" }, { status: 409 });
  }

  const ref = await db.collection(COUPONS_COLLECTION).add({
    ...couponToFirestore({ ...parsed.data, code, usedCount: 0 }),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return NextResponse.json({ id: ref.id }, { status: 201 });
}
