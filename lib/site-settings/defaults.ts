import type { SiteSettings } from "@/types/site-settings";

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  hero: {
    eyebrow: "Ushuaia · Tierra del Fuego",
    title: "AVENTURATE EN EL FIN DEL MUNDO CON MERU",
    subtitle: "VIAJES Y TURISMO",
    ctaPrimaryLabel: "Ver excursiones",
    ctaPrimaryHref: "/#excursiones",
    ctaSecondaryLabel: "Consultanos",
    ctaSecondaryHref: "/#consulta",
  },
  excursionsPreview: {
    title: "Nuestras Excursiones",
    description:
      "Descubrí experiencias en Ushuaia y Tierra del Fuego. Todas las excursiones se publican desde nuestro catálogo oficial.",
  },
  about: {
    title: "Sobre Nosotros",
    quote: "Descubre la magia del Fin del Mundo con nosotros",
    values: [
      {
        title: "Nuestra Misión",
        text: "Crear experiencias únicas y memorables en Ushuaia, conectando a los viajeros con la naturaleza y la cultura local de manera sostenible.",
      },
      {
        title: "Nuestra Visión",
        text: "Ser la referencia en turismo aventura en Tierra del Fuego, ofreciendo las mejores excursiones y experiencias para nuestros visitantes.",
      },
      {
        title: "Nuestros Valores",
        text: "Compromiso con la excelencia, respeto por la naturaleza y pasión por brindar experiencias auténticas y seguras.",
      },
    ],
    closingText:
      "En Turismo Meru, nos dedicamos a hacer realidad tus sueños de aventura en el Fin del Mundo. Con años de experiencia y un equipo apasionado, te garantizamos experiencias únicas y seguras en los paisajes más impresionantes de Ushuaia y Tierra del Fuego.",
  },
  inquiry: {
    title: "¿Tienes alguna consulta?",
    subtitle: "Estamos aquí para ayudarte a planificar tu próxima aventura",
  },
  footer: {
    brandName: "Meru Viajes y Turismo",
    tagline:
      "Aventurate en el Fin del Mundo. Excursiones y experiencias únicas en Ushuaia, Tierra del Fuego.",
    address: "Ushuaia, Tierra del Fuego, Argentina",
    email: "info@meruviajes.tur.ar",
    phoneLabel: "Consultanos por WhatsApp",
  },
};
