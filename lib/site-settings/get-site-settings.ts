import { DEFAULT_SITE_SETTINGS } from "@/lib/site-settings/defaults";
import { getAdminFirestore, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import type { SiteSettings } from "@/types/site-settings";

export const SITE_SETTINGS_DOC = "main";
export const SITE_SETTINGS_COLLECTION = "siteSettings";

type HeroFirestore = SiteSettings["hero"] & { backgroundImageUrl?: string };

function mergeHero(partial?: Partial<HeroFirestore>): SiteSettings["hero"] {
  const merged = { ...DEFAULT_SITE_SETTINGS.hero, ...partial };
  const backgroundImages = [...(merged.backgroundImages ?? [])];
  const legacyUrl = partial?.backgroundImageUrl?.trim();

  if (legacyUrl && !backgroundImages.includes(legacyUrl)) {
    backgroundImages.unshift(legacyUrl);
  }

  return { ...merged, backgroundImages };
}

function mergeSettings(partial: Partial<SiteSettings> & { hero?: Partial<HeroFirestore> }): SiteSettings {
  return {
    hero: mergeHero(partial.hero),
    excursionsPreview: {
      ...DEFAULT_SITE_SETTINGS.excursionsPreview,
      ...partial.excursionsPreview,
    },
    about: {
      ...DEFAULT_SITE_SETTINGS.about,
      ...partial.about,
      values: partial.about?.values?.length
        ? partial.about.values
        : DEFAULT_SITE_SETTINGS.about.values,
    },
    inquiry: { ...DEFAULT_SITE_SETTINGS.inquiry, ...partial.inquiry },
    footer: { ...DEFAULT_SITE_SETTINGS.footer, ...partial.footer },
  };
}

export async function getSiteSettings(): Promise<SiteSettings> {
  if (!isFirebaseAdminConfigured()) {
    return DEFAULT_SITE_SETTINGS;
  }

  const db = getAdminFirestore();
  if (!db) return DEFAULT_SITE_SETTINGS;

  const doc = await db.collection(SITE_SETTINGS_COLLECTION).doc(SITE_SETTINGS_DOC).get();
  if (!doc.exists) return DEFAULT_SITE_SETTINGS;

  return mergeSettings(doc.data() as Partial<SiteSettings>);
}
