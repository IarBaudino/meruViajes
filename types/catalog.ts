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
