import { brand } from "@/config/brand";
import type { SiteSettings } from "@/types/site-settings";

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  hero: {
    eyebrow: brand.location.line,
    title: `DESCUBRÍ ${brand.location.city.toUpperCase()} CON ${brand.shortName.toUpperCase()}`,
    subtitle: "VIAJES Y TURISMO",
    ctaPrimaryLabel: "Ver excursiones",
    ctaPrimaryHref: "/#excursiones",
    ctaSecondaryLabel: "Consultanos",
    ctaSecondaryHref: "/#consulta",
    backgroundImages: [],
    backgroundMedia: [],
  },
  excursionsPreview: {
    title: "Nuestras Excursiones",
    description: `Descubrí experiencias en ${brand.location.city} y ${brand.location.region}. Todas las excursiones se publican desde nuestro catálogo oficial.`,
  },
  packagesPreview: {
    title: "Nuestros Paquetes",
    description:
      "Combinaciones pensadas para aprovechar mejor tu estadía. Armamos el itinerario según tus fechas.",
  },
  groupTripsPreview: {
    title: "Viajes grupales",
    description:
      "Ediciones con fechas fijas, itinerario día por día y seña para confirmar tu lugar.",
  },
  about: {
    title: "Sobre Nosotros",
    quote: `Descubrí ${brand.location.city} con nosotros`,
    values: [
      {
        title: "Nuestra Misión",
        text: `Crear experiencias únicas y memorables en ${brand.location.city}, conectando a los viajeros con la naturaleza y la cultura local de manera sostenible.`,
      },
      {
        title: "Nuestra Visión",
        text: `Ser la referencia en turismo en ${brand.location.region}, ofreciendo las mejores excursiones y experiencias para nuestros visitantes.`,
      },
      {
        title: "Nuestros Valores",
        text: "Compromiso con la excelencia, respeto por la naturaleza y pasión por brindar experiencias auténticas y seguras.",
      },
    ],
    closingText: `En ${brand.agencyName} nos dedicamos a hacer realidad tus sueños de viaje. Con un equipo apasionado, te garantizamos experiencias únicas y seguras en ${brand.location.city} y ${brand.location.region}.`,
  },
  inquiry: {
    title: "¿Tienes alguna consulta?",
    subtitle: "Estamos aquí para ayudarte a planificar tu próxima aventura",
  },
  footer: {
    brandName: brand.agencyName,
    tagline: `Excursiones y experiencias únicas en ${brand.location.city}, ${brand.location.region}.`,
    address: brand.location.address,
    email: brand.email,
    phoneLabel: brand.phoneLabel,
    phoneNumber: brand.phoneDigits,
  },
  social: {
    instagramUrl: brand.social.instagramUrl,
    instagramHandle: brand.social.instagramHandle,
  },
  googleReviews: {
    enabled: false,
    placeId: "",
    title: "Lo que dicen en Google",
  },
  booking: {
    orderHoldHours: 48,
    hoursBeforeDeparture: 2,
    holdWarningMessage: "",
  },
  payments: {
    bankName: "",
    accountHolder: "",
    cbu: "",
    alias: "",
    notes: "",
  },
};
