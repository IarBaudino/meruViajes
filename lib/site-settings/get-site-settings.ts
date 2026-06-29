import { DEFAULT_SITE_SETTINGS } from "@/lib/site-settings/defaults";
import { getAdminFirestore, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import type { SiteSettings } from "@/types/site-settings";

export const SITE_SETTINGS_DOC = "main";
export const SITE_SETTINGS_COLLECTION = "siteSettings";

function mergeSettings(partial: Partial<SiteSettings>): SiteSettings {
  return {
    hero: { ...DEFAULT_SITE_SETTINGS.hero, ...partial.hero },
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
