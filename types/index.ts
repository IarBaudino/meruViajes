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
  serviceId: string;
  slug: string;
  title: string;
  price: number;
  quantity: number;
  image?: string;
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
  guides?: Record<string, unknown>;
  stock: number;
  active: boolean;
}

export interface SeasonalPhoto {
  season: "verano" | "invierno" | "primavera" | "otono";
  url: string;
  label?: string;
}

export type PaymentStatus = "pendiente" | "pagado";

export interface Order {
  id: string;
  userId: string;
  orderDate: Date;
  total: number;
  paymentMethod?: string;
  paymentInformation?: string;
  paymentStatus: PaymentStatus;
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
