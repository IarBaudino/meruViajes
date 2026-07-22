export interface SiteValueBlock {
  title: string;
  text: string;
}

export interface SiteSettings {
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    ctaPrimaryLabel: string;
    ctaPrimaryHref: string;
    ctaSecondaryLabel: string;
    ctaSecondaryHref: string;
    backgroundImages?: string[];
  };
  excursionsPreview: {
    title: string;
    description: string;
  };
  about: {
    title: string;
    quote: string;
    values: SiteValueBlock[];
    closingText: string;
  };
  inquiry: {
    title: string;
    subtitle: string;
  };
  footer: {
    brandName: string;
    tagline: string;
    address: string;
    email: string;
    /** Texto visible, ej. (2901) 588864 */
    phoneLabel: string;
    /** Solo dígitos para tel:/WhatsApp, ej. 2901588864 */
    phoneNumber?: string;
  };
  googleReviews?: {
    enabled: boolean;
    placeId: string;
    title: string;
  };
  /** Configuración de reservas / cupos. */
  booking?: {
    /** Horas que se sostiene el cupo sin pago (24–336). */
    orderHoldHours: number;
    /**
     * Si está activo, las reservas nuevas usan shortHoldHours
     * (útil para último momento).
     */
    shortHoldEnabled?: boolean;
    /** Plazo corto en horas (1–23), ej. 2. */
    shortHoldHours?: number;
    /**
     * Advertencia al cliente. Usá {horas} para insertar el plazo vigente.
     * Vacío = texto por defecto.
     */
    holdWarningMessage?: string;
  };
}
