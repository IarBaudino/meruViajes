import type { GroupTrip } from "@/types/catalog";

function todayYmd() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function isGroupTripPresaleActive(trip: Pick<GroupTrip, "presalePrice" | "presaleUntil" | "price">) {
  const presale = Number(trip.presalePrice) || 0;
  if (!(presale > 0) || presale >= trip.price) return false;
  if (trip.presaleUntil) return todayYmd() <= trip.presaleUntil;
  return true;
}

/** Precio vigente por persona (preventa o tarifa normal). */
export function getGroupTripUnitPrice(trip: Pick<GroupTrip, "price" | "presalePrice" | "presaleUntil">) {
  return isGroupTripPresaleActive(trip) ? Number(trip.presalePrice) : trip.price;
}

/** Lo que se cobra ahora: seña si hay, si no el precio vigente. */
export function getGroupTripChargeNow(
  trip: Pick<GroupTrip, "price" | "presalePrice" | "presaleUntil" | "depositAmount">
) {
  const deposit = Number(trip.depositAmount) || 0;
  if (deposit > 0) return deposit;
  return getGroupTripUnitPrice(trip);
}

export function getGroupTripBalancePerPerson(
  trip: Pick<GroupTrip, "price" | "presalePrice" | "presaleUntil" | "depositAmount">
) {
  const unit = getGroupTripUnitPrice(trip);
  const deposit = Number(trip.depositAmount) || 0;
  return Math.max(0, unit - deposit);
}

export function groupTripHasDeposit(
  trip: Pick<GroupTrip, "depositAmount">
) {
  return (Number(trip.depositAmount) || 0) > 0;
}
