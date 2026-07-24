import type {
  ServiceDiscounts,
  DiscountOption,
  ServicePromotion,
} from "@/types/discounts";

export type {
  ServiceDiscounts,
  PassengerCategory,
  DiscountOption,
  ServicePromotion,
} from "@/types/discounts";
export { PASSENGER_CATEGORY_LABELS, legacyDiscountsToOptions } from "@/types/discounts";


export type UserRole = "customer" | "admin";

export interface User {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  dni?: string;
  phone?: string;
  address?: string;
  image?: string;
  shoppingCart?: CartItem[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItem {
  /** Por defecto "service". Los paquetes usan kind="package" y serviceId = packageId. */
  kind?: "service" | "package";
  serviceId: string;
  packageId?: string;
  slug: string;
  title: string;
  /** Precio unitario adulto (excursión) o precio del paquete. */
  price: number;
  /** Cupos / plazas (suma de pasajeros en excursiones). */
  quantity: number;
  image?: string;
  /** Desglose de pasajeros (solo excursiones). */
  passengers?: {
    adult: number;
    infant: number;
    discounted: Array<{
      optionId: string;
      label: string;
      percent: number;
      quantity: number;
    }>;
  };
  /** Snapshot de opciones de descuento al agregar. */
  discountOptions?: DiscountOption[];
  /** Snapshot de promo vigente al agregar (si había). */
  promotionApplied?: boolean;
  /** Precio adulto usado (habitual o promo). */
  unitAdultPrice?: number;
  /** Turno elegido (excursiones con salidas). */
  departureId?: string;
  departureDate?: string;
  departureTime?: string;
  /** Paquetes: rango de fechas de estadía del viajero. */
  stayFrom?: string;
  stayTo?: string;
  /** Snapshot de excursiones incluidas en el paquete (solo informativo). */
  includedServices?: Array<{
    serviceId: string;
    title: string;
    slug?: string;
    description?: string;
  }>;
  /** @deprecated */
  discounts?: ServiceDiscounts;
  /** Total de la línea ya calculado con descuentos. */
  lineTotal?: number;
}

export interface Service {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  duration?: string;
  difficulty?: string;
  location?: string;
  photos: string[];
  seasonalPhotos?: SeasonalPhoto[];
  category?: string;
  meetingPoint?: string;
  requirements?: string;
  cancellationPolicy?: string;
  additionalEquipment?: string;
  notIncluded?: string;
  /** Descuentos flexibles por tipo de pasajero (% sobre tarifa adulta vigente). */
  discountOptions?: DiscountOption[];
  /** Promo temporal de precio adulto + qué descuentos aplican. */
  promotion?: ServicePromotion | null;
  /** @deprecated Migrado a discountOptions al leer. */
  discounts?: ServiceDiscounts;
  guides?: Record<string, unknown>;
  stock: number;
  /** Salidas / turnos con cupo propio. Si hay turnos, el cliente elige fecha y hora. */
  departures?: DepartureSlot[];
  /** Destacar en el home. */
  featuredOnHome?: boolean;
  /** Orden en el home (menor = primero). */
  homeOrder?: number;
  active: boolean;
}

export interface DepartureSlot {
  id: string;
  date: string;
  time: string;
  capacity: number;
  booked: number;
  active: boolean;
}

export interface SeasonalPhoto {
  season: "verano" | "invierno" | "primavera" | "otono";
  url: string;
  label?: string;
}

export type PaymentStatus = "pendiente" | "pagado" | "cancelado";

export interface OrderItem {
  serviceId: string;
  serviceTitle: string;
  slug: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  packageId?: string;
  packageTitle?: string;
  passengers?: {
    adult: number;
    infant: number;
    discounted?: Array<{
      optionId: string;
      label: string;
      percent: number;
      quantity: number;
    }>;
    /** @deprecated */
    minor?: number;
    senior?: number;
  };
  departureId?: string;
  departureDate?: string;
  departureTime?: string;
  /** Paquetes: rango de fechas indicado por el cliente. */
  stayFrom?: string;
  stayTo?: string;
  /** Excursiones del paquete (informativo; el armado es manual). */
  includedServices?: Array<{
    serviceId: string;
    title: string;
    slug?: string;
    description?: string;
  }>;
  /** Si es true, el admin arma itinerario y descuenta cupos a mano. */
  fulfillmentMode?: "auto" | "manual";
  /** @deprecated Paquetes viejos con turnos automáticos. */
  includedDepartures?: Array<{
    serviceId: string;
    departureId: string;
    quantity: number;
    departureDate?: string;
    departureTime?: string;
    serviceTitle?: string;
  }>;
}

export interface Order {
  id: string;
  userId: string;
  orderDate: Date;
  total: number;
  paymentMethod?: string;
  paymentInformation?: string;
  paymentStatus: PaymentStatus;
  items?: OrderItem[];
  customerName?: string;
  customerEmail?: string;
  customerDni?: string;
  customerPhone?: string;
  /** Oculta la orden del listado principal de admin. */
  archived?: boolean;
  archivedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Booking {
  id: string;
  userId: string;
  serviceId: string;
  serviceTitle: string;
  bookingDate: Date;
  DNI_Personal: string;
  serviceOrderId?: string;
  quantity?: number;
  unitPrice?: number;
  lineTotal?: number;
  seatNumber?: number;
  active: boolean;
}

export interface Review {
  id: string;
  userId: string;
  serviceId: string;
  serviceTitle: string;
  content: string;
  rating: number;
  active: boolean;
}

export type InquiryStatus = "nuevo" | "respondido";

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  message: string;
  status: InquiryStatus;
  createdAt: Date;
}
