import type { DocumentData } from "firebase-admin/firestore";
import type { GroupTrip, GroupTripBlock, GroupTripDay, GroupTripLodging } from "@/types/catalog";
import { defaultDurationLabel } from "@/features/group-trips/lib/dates";

export const GROUP_TRIPS_COLLECTION = "groupTrips";

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string").map((v) => v.trim()).filter(Boolean);
}

function asNumber(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function mapBlock(raw: unknown): GroupTripBlock | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const title = asString(o.title).trim();
  const description = asString(o.description).trim();
  if (!title || !description) return null;
  return {
    id: asString(o.id) || `b-${Math.random().toString(36).slice(2, 9)}`,
    title,
    description,
    optional: o.optional === true,
    photo: asString(o.photo),
    whatYouNeed: asString(o.whatYouNeed),
  };
}

function mapDay(raw: unknown): GroupTripDay | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const title = asString(o.title).trim();
  const blocks = Array.isArray(o.blocks)
    ? o.blocks.map(mapBlock).filter((b): b is GroupTripBlock => Boolean(b))
    : [];
  if (!title || blocks.length === 0) return null;
  const dayNumber = Math.max(1, Math.round(asNumber(o.dayNumber, 1)));
  return {
    id: asString(o.id) || `d-${Math.random().toString(36).slice(2, 9)}`,
    dayNumber,
    date: asString(o.date),
    title,
    blocks,
  };
}

function mapLodging(raw: unknown): GroupTripLodging | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const name = asString(o.name).trim();
  if (!name) return null;
  return {
    id: asString(o.id) || `l-${Math.random().toString(36).slice(2, 9)}`,
    name,
    place: asString(o.place),
    includes: asString(o.includes),
  };
}

function mapLodgings(data: DocumentData): GroupTripLodging[] {
  if (Array.isArray(data.lodgings)) {
    return data.lodgings.map(mapLodging).filter((l): l is GroupTripLodging => Boolean(l));
  }
  const legacyName = asString(data.lodgingName).trim();
  if (!legacyName) return [];
  return [
    {
      id: "legacy",
      name: legacyName,
      place: "",
      includes: asString(data.lodgingNotes),
    },
  ];
}

export function mapFirestoreGroupTrip(id: string, data: DocumentData): GroupTrip {
  const itineraryDays = Array.isArray(data.itineraryDays)
    ? data.itineraryDays.map(mapDay).filter((d): d is GroupTripDay => Boolean(d))
    : [];

  const capacity = Math.max(1, Math.round(asNumber(data.capacity, 1)));
  const stockRaw = asNumber(data.stock, capacity);

  return {
    id,
    title: asString(data.title),
    subtitle: asString(data.subtitle),
    slug: asString(data.slug),
    destination: asString(data.destination),
    description: asString(data.description),
    photos: asStringArray(data.photos),
    startDate: asString(data.startDate),
    endDate: asString(data.endDate),
    durationLabel:
      asString(data.durationLabel) ||
      defaultDurationLabel(asString(data.startDate), asString(data.endDate)),
    checkInTime: asString(data.checkInTime),
    checkOutTime: asString(data.checkOutTime),
    lodgings: mapLodgings(data),
    included: asStringArray(data.included),
    notIncluded: asStringArray(data.notIncluded),
    itineraryDays,
    packingList: asStringArray(data.packingList),
    price: asNumber(data.price),
    presalePrice: asNumber(data.presalePrice),
    presaleUntil: asString(data.presaleUntil),
    depositAmount: asNumber(data.depositAmount),
    balanceDueDate: asString(data.balanceDueDate),
    depositNonRefundable: data.depositNonRefundable !== false,
    cancellationPolicy: asString(data.cancellationPolicy),
    reservationPolicy: asString(data.reservationPolicy),
    capacity,
    stock: Math.max(0, Math.round(stockRaw)),
    active: data.active !== false,
    featuredOnHome: data.featuredOnHome === true,
    homeOrder: typeof data.homeOrder === "number" ? data.homeOrder : 100,
  };
}

export function groupTripToFirestore(data: Omit<GroupTrip, "id">): DocumentData {
  const capacity = Math.max(1, Math.round(Number(data.capacity) || 1));
  const stock =
    Number.isFinite(data.stock) && data.stock >= 0 ? Math.round(data.stock) : capacity;

  return {
    title: data.title,
    subtitle: data.subtitle?.trim() || "",
    slug: data.slug,
    destination: data.destination,
    description: data.description,
    photos: data.photos,
    startDate: data.startDate,
    endDate: data.endDate,
    durationLabel:
      data.durationLabel?.trim() || defaultDurationLabel(data.startDate, data.endDate),
    checkInTime: data.checkInTime?.trim() || "",
    checkOutTime: data.checkOutTime?.trim() || "",
    lodgings: (data.lodgings ?? [])
      .map((item) => ({
        id: item.id,
        name: item.name.trim(),
        place: item.place?.trim() || "",
        includes: item.includes?.trim() || "",
      }))
      .filter((item) => item.name),
    included: data.included.map((s) => s.trim()).filter(Boolean),
    notIncluded: data.notIncluded.map((s) => s.trim()).filter(Boolean),
    itineraryDays: data.itineraryDays.map((day) => ({
      id: day.id,
      dayNumber: day.dayNumber,
      date: day.date?.trim() || "",
      title: day.title,
      blocks: day.blocks.map((block) => ({
        id: block.id,
        title: block.title,
        description: block.description,
        optional: block.optional === true,
        photo: block.photo?.trim() || "",
        whatYouNeed: block.whatYouNeed?.trim() || "",
      })),
    })),
    packingList: data.packingList.map((s) => s.trim()).filter(Boolean),
    price: data.price,
    presalePrice: Number(data.presalePrice) > 0 ? Number(data.presalePrice) : 0,
    presaleUntil: data.presaleUntil?.trim() || "",
    depositAmount: Number(data.depositAmount) > 0 ? Number(data.depositAmount) : 0,
    balanceDueDate: data.balanceDueDate?.trim() || "",
    depositNonRefundable: data.depositNonRefundable !== false,
    cancellationPolicy: data.cancellationPolicy?.trim() || "",
    reservationPolicy: data.reservationPolicy?.trim() || "",
    capacity,
    stock,
    active: data.active,
    featuredOnHome: data.featuredOnHome === true,
    homeOrder: Number.isFinite(data.homeOrder) ? Number(data.homeOrder) : 100,
  };
}
