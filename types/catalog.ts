import type { Season } from "@/types";

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  sortOrder: number;
  visible: boolean;
}

export interface ExcursionPackage {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  photos: string[];
  serviceIds: string[];
  stock: number;
  active: boolean;
  category?: string;
  /** Destacar en el home. */
  featuredOnHome?: boolean;
  /** Orden en el home (menor = primero). */
  homeOrder?: number;
  /** Temporadas en las que se ofrece el paquete. */
  seasons?: Season[];
  /** Promo opcional: % de descuento sobre el precio del paquete. */
  promotion?: PackagePromotion | null;
}

/** Descuento porcentual sobre el precio base del paquete. */
export interface PackagePromotion {
  enabled: boolean;
  /** Entero 1–100. */
  percent: number;
}

export interface GroupTripBlock {
  id: string;
  title: string;
  description: string;
  optional: boolean;
  photo?: string;
  whatYouNeed?: string;
}

export interface GroupTripLodging {
  id: string;
  name: string;
  place?: string;
  includes?: string;
}

export interface GroupTripDay {
  id: string;
  dayNumber: number;
  date?: string;
  title: string;
  blocks: GroupTripBlock[];
}

/** Viaje grupal: edición con fechas fijas, itinerario propio y seña. */
export interface GroupTrip {
  id: string;
  title: string;
  subtitle?: string;
  slug: string;
  destination: string;
  description: string;
  photos: string[];
  startDate: string;
  endDate: string;
  durationLabel?: string;
  checkInTime?: string;
  checkOutTime?: string;
  lodgings: GroupTripLodging[];
  /** @deprecated Usar lodgings. */
  lodgingName?: string;
  /** @deprecated Usar lodgings[].includes. */
  lodgingNotes?: string;
  included: string[];
  notIncluded: string[];
  itineraryDays: GroupTripDay[];
  packingList: string[];
  /** Tarifa normal por persona. */
  price: number;
  /** Preventa opcional (menor que price). */
  presalePrice?: number;
  presaleUntil?: string;
  /** Seña por persona. 0 = se cobra el total. */
  depositAmount: number;
  balanceDueDate?: string;
  depositNonRefundable: boolean;
  cancellationPolicy?: string;
  reservationPolicy?: string;
  /** Cupo total del grupo. */
  capacity: number;
  /** Lugares restantes. */
  stock: number;
  active: boolean;
  featuredOnHome?: boolean;
  homeOrder?: number;
}

export interface GoogleReviewItem {
  authorName: string;
  rating: number;
  text: string;
  relativeTime?: string;
  profilePhotoUrl?: string;
}

export interface GoogleReviewsCache {
  placeId: string;
  rating?: number;
  userRatingsTotal?: number;
  reviews: GoogleReviewItem[];
  updatedAt: Date | string;
}
