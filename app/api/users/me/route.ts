import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPasswordProvider } from "@/lib/auth/auth-providers";
import { getAdminAuth, getAdminFirestore } from "@/lib/firebase/admin";
import {
  normalizeBilling,
  orderBillingSchema,
  parseStoredBilling,
} from "@/schemas/billing";
import { profileSchema } from "@/schemas/user";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const db = getAdminFirestore();
  if (!db) {
    return NextResponse.json({ error: "Servidor no configurado" }, { status: 503 });
  }

  const doc = await db.collection("users").doc(session.user.id).get();
  if (!doc.exists) {
    return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
  }

  const data = doc.data()!;

  let authProviders: string[] = [];
  let hasPasswordLogin = false;

  const adminAuth = getAdminAuth();
  if (adminAuth) {
    try {
      const authUser = await adminAuth.getUser(session.user.id);
      authProviders = authUser.providerData.map((p) => p.providerId);
      hasPasswordLogin = hasPasswordProvider(authProviders);
    } catch {
      authProviders = [];
    }
  }

  return NextResponse.json({
    uid: session.user.id,
    name: data.name ?? "",
    email: data.email ?? session.user.email ?? "",
    dni: data.dni ?? "",
    phone: data.phone ?? "",
    address: data.address ?? "",
    billing: parseStoredBilling(data.billing),
    role: data.role ?? session.user.role ?? "customer",
    authProviders,
    hasPasswordLogin,
  });
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const email = session.user.email ?? body.email;

  const billingRaw = body.billing
    ? {
        ...body.billing,
        fullName: body.billing.fullName ?? body.name,
        email: body.billing.email ?? email,
      }
    : {
        fullName: body.name,
        email,
        phoneCountryCode: body.phoneCountryCode,
        phoneNumber: body.phoneNumber,
        identificationType: body.identificationType,
        identificationNumber: body.identificationNumber,
        addressCountry: body.addressCountry,
        addressCity: body.addressCity,
        addressStreet: body.addressStreet,
        addressApartment: body.addressApartment,
        addressPostalCode: body.addressPostalCode,
      };

  const parsedProfile = profileSchema.safeParse({
    name: body.name,
    email,
    phoneCountryCode: billingRaw.phoneCountryCode,
    phoneNumber: billingRaw.phoneNumber,
    identificationType: billingRaw.identificationType,
    identificationNumber: billingRaw.identificationNumber,
    addressCountry: billingRaw.addressCountry,
    addressCity: billingRaw.addressCity,
    addressStreet: billingRaw.addressStreet,
    addressApartment: billingRaw.addressApartment ?? "",
    addressPostalCode: billingRaw.addressPostalCode,
  });

  if (!parsedProfile.success) {
    return NextResponse.json(
      { error: parsedProfile.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const billingParsed = orderBillingSchema.safeParse({
    fullName: parsedProfile.data.name,
    email: parsedProfile.data.email,
    phoneCountryCode: parsedProfile.data.phoneCountryCode,
    phoneNumber: parsedProfile.data.phoneNumber,
    identificationType: parsedProfile.data.identificationType,
    identificationNumber: parsedProfile.data.identificationNumber,
    addressCountry: parsedProfile.data.addressCountry,
    addressCity: parsedProfile.data.addressCity,
    addressStreet: parsedProfile.data.addressStreet,
    addressApartment: parsedProfile.data.addressApartment ?? "",
    addressPostalCode: parsedProfile.data.addressPostalCode,
  });

  if (!billingParsed.success) {
    return NextResponse.json(
      { error: billingParsed.error.issues[0]?.message ?? "Datos de facturación inválidos" },
      { status: 400 }
    );
  }

  const db = getAdminFirestore();
  if (!db) {
    return NextResponse.json({ error: "Servidor no configurado" }, { status: 503 });
  }

  const billing = normalizeBilling(billingParsed.data);
  const addressLine = `${billing.address.street}${
    billing.address.apartment ? `, ${billing.address.apartment}` : ""
  }, ${billing.address.city}, ${billing.address.country} (${billing.address.postalCode})`;

  await db
    .collection("users")
    .doc(session.user.id)
    .set(
      {
        name: parsedProfile.data.name,
        dni: billing.identificationNumber,
        phone: billing.phoneFull,
        address: addressLine,
        billing,
        updatedAt: new Date(),
      },
      { merge: true }
    );

  return NextResponse.json({ ok: true, billing });
}
