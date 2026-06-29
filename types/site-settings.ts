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
    backgroundImageUrl?: string;
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
    phoneLabel: string;
  };
}
