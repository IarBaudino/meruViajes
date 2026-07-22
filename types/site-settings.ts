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
    /** Máximo de horas después de reservar sin pagar. */
    orderHoldHours: number;
    /**
     * Horas antes de la salida en que cae una reserva sin pago
     * (y se liberan los cupos). Ej. 2 = martes 9:00 → cae a las 7:00.
     */
    hoursBeforeDeparture: number;
    /**
     * @deprecated Usar hoursBeforeDeparture.
     */
    shortHoldHours?: number;
    /**
     * @deprecated Ya no se fuerza plazo corto global.
     */
    shortHoldEnabled?: boolean;
    /**
     * Advertencia al cliente. Usá {horas} para el plazo vigente.
     */
    holdWarningMessage?: string;
  };
}
