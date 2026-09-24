/**
 * Identidad de la agencia. Cada cliente se configura con NEXT_PUBLIC_BRAND_*.
 * Los fallbacks son placeholders de plantilla, no de un cliente real.
 */
function env(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

function csv(name: string, fallback: string[]): string[] {
  const raw = env(name);
  if (!raw) return fallback;
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function getAppUrl(): string {
  return (env("NEXT_PUBLIC_APP_URL") ?? "http://localhost:3000").replace(/\/$/, "");
}

const agencyName = env("NEXT_PUBLIC_BRAND_NAME") ?? "Kusi Turismo";
const shortName = env("NEXT_PUBLIC_BRAND_SHORT_NAME") ?? "Kusi";
const city = env("NEXT_PUBLIC_BRAND_CITY") ?? "Tu ciudad";
const region = env("NEXT_PUBLIC_BRAND_REGION") ?? "Tu provincia";
const country = env("NEXT_PUBLIC_BRAND_COUNTRY") ?? "Argentina";
const countryCode = env("NEXT_PUBLIC_BRAND_COUNTRY_CODE") ?? "AR";
const slug = env("NEXT_PUBLIC_BRAND_SLUG") ?? "kusi";

export const brand = {
  agencyName,
  shortName,
  slug,
  logo: {
    src: env("NEXT_PUBLIC_BRAND_LOGO_SRC") ?? "/logoKusi.png",
    width: Number(env("NEXT_PUBLIC_BRAND_LOGO_WIDTH") ?? "381"),
    height: Number(env("NEXT_PUBLIC_BRAND_LOGO_HEIGHT") ?? "430"),
  },
  locale: env("NEXT_PUBLIC_BRAND_LOCALE") ?? "es_AR",
  htmlLang: env("NEXT_PUBLIC_BRAND_HTML_LANG") ?? "es",
  currency: env("NEXT_PUBLIC_BRAND_CURRENCY") ?? "ARS",
  countryCallingCode: env("NEXT_PUBLIC_BRAND_CALLING_CODE") ?? "54",
  whatsappNumber: env("NEXT_PUBLIC_WHATSAPP_NUMBER") ?? "",
  email: env("NEXT_PUBLIC_BRAND_EMAIL") ?? "info@kusiturismo.com",
  phoneLabel: env("NEXT_PUBLIC_BRAND_PHONE_LABEL") ?? "Teléfono",
  phoneDigits: env("NEXT_PUBLIC_BRAND_PHONE_DIGITS") ?? "",
  location: {
    city,
    region,
    country,
    countryCode,
    address: env("NEXT_PUBLIC_BRAND_ADDRESS") ?? `${city}, ${region}, ${country}`,
    line: env("NEXT_PUBLIC_BRAND_LOCATION_LINE") ?? `${city} · ${region}`,
  },
  social: {
    instagramUrl: env("NEXT_PUBLIC_INSTAGRAM_URL") ?? "",
    instagramHandle: env("NEXT_PUBLIC_INSTAGRAM_HANDLE") ?? "",
  },
  seo: {
    titleDefault:
      env("NEXT_PUBLIC_SEO_TITLE") ?? `${agencyName} | Excursiones en ${city}`,
    titleTemplate: env("NEXT_PUBLIC_SEO_TITLE_TEMPLATE") ?? `%s | ${agencyName}`,
    description:
      env("NEXT_PUBLIC_SEO_DESCRIPTION") ??
      `Excursiones, navegaciones y paquetes en ${city}, ${region}. Reservá online con ${agencyName}.`,
    keywords: csv("NEXT_PUBLIC_SEO_KEYWORDS", [
      `excursiones ${city}`,
      `turismo ${region}`,
      shortName,
      `paquetes ${city}`,
    ]),
  },
  theme: {
    primary: env("NEXT_PUBLIC_THEME_PRIMARY") ?? "#203d6c",
    primaryDark: env("NEXT_PUBLIC_THEME_PRIMARY_DARK") ?? "#203d6c",
    secondary: env("NEXT_PUBLIC_THEME_SECONDARY") ?? "#48638f",
    secondaryHover: env("NEXT_PUBLIC_THEME_SECONDARY_HOVER") ?? "#48638f",
    charcoal: env("NEXT_PUBLIC_THEME_CHARCOAL") ?? "#203d6c",
    charcoalMuted: env("NEXT_PUBLIC_THEME_CHARCOAL_MUTED") ?? "#48638f",
    sand: env("NEXT_PUBLIC_THEME_SAND") ?? "#d0c1a9",
    ice: env("NEXT_PUBLIC_THEME_ICE") ?? "#ebe3d6",
    surface: env("NEXT_PUBLIC_THEME_SURFACE") ?? "#faf6f0",
    border: env("NEXT_PUBLIC_THEME_BORDER") ?? "#c5b7a0",
  },
  developerCredit: {
    enabled: env("NEXT_PUBLIC_DEVELOPER_CREDIT") !== "false",
    name: env("NEXT_PUBLIC_DEVELOPER_NAME") ?? "Iara Baudino",
    url: env("NEXT_PUBLIC_DEVELOPER_URL") ?? "https://www.iarabaudinodev.com.ar",
  },
  cartStorageKey: env("NEXT_PUBLIC_CART_STORAGE_KEY") ?? `${slug}-cart-v10`,
} as const;

export function brandLogoAlt(): string {
  return brand.agencyName;
}

export function brandEmailSignatureHtml(): string {
  return `Equipo ${brand.agencyName}<br>${brand.location.city}, ${brand.location.region}`;
}

export function brandEmailSignatureText(): string {
  return `Equipo ${brand.agencyName} — ${brand.location.city}, ${brand.location.region}`;
}

export function brandLogoHtml(width = 120): string {
  const src = `${getAppUrl()}${brand.logo.src}`;
  return `<img src="${src}" alt="${brand.agencyName}" width="${width}" style="display:block;margin:0 0 20px 0" />`;
}

export function brandThemeCssVars(): Record<string, string> {
  const { theme } = brand;
  return {
    "--color-brand-primary": theme.primary,
    "--color-brand-primary-dark": theme.primaryDark,
    "--color-brand-secondary": theme.secondary,
    "--color-brand-secondary-hover": theme.secondaryHover,
    "--color-brand-accent": theme.primary,
    "--color-brand-forest": theme.primary,
    "--color-brand-charcoal": theme.charcoal,
    "--color-brand-charcoal-muted": theme.charcoalMuted,
    "--color-brand-muted": theme.charcoalMuted,
    "--color-brand-sand": theme.sand,
    "--color-brand-ice": theme.ice,
    "--color-brand-surface": theme.surface,
    "--color-brand-border": theme.border,
  };
}

export function formatPhoneHref(digits: string): { tel: string; whatsapp: string } {
  const cleaned = digits.replace(/\D/g, "");
  const code = brand.countryCallingCode;
  const national = cleaned.startsWith(code) ? cleaned.slice(code.length) : cleaned;
  return {
    tel: `tel:+${code}${national}`,
    whatsapp: `https://wa.me/${code}${national}`,
  };
}
