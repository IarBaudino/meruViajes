import { DEFAULT_SITE_SETTINGS } from "@/lib/site-settings/defaults";
import { getAdminFirestore, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { detectMediaType } from "@/lib/media/detect-media-type";
import type { HeroMediaItem, SiteSettings } from "@/types/site-settings";

export const SITE_SETTINGS_DOC = "main";
export const SITE_SETTINGS_COLLECTION = "siteSettings";

type HeroFirestore = SiteSettings["hero"] & { backgroundImageUrl?: string };

function normalizeMedia(items: HeroMediaItem[] | undefined): HeroMediaItem[] {
  if (!Array.isArray(items)) return [];
  return items
    .filter((item) => item && typeof item.url === "string" && item.url.trim())
    .map((item) => ({
      type: item.type === "video" ? "video" : detectMediaType(item.url),
      url: item.url.trim(),
    }));
}

function mergeHero(partial?: Partial<HeroFirestore>): SiteSettings["hero"] {
  const merged = { ...DEFAULT_SITE_SETTINGS.hero, ...partial };
  let backgroundMedia = normalizeMedia(merged.backgroundMedia);

  if (backgroundMedia.length === 0) {
    const backgroundImages = [...(merged.backgroundImages ?? [])];
    const legacyUrl = partial?.backgroundImageUrl?.trim();
    if (legacyUrl && !backgroundImages.includes(legacyUrl)) {
      backgroundImages.unshift(legacyUrl);
    }
    backgroundMedia = backgroundImages
      .filter((url) => typeof url === "string" && url.trim())
      .map((url) => ({ type: detectMediaType(url), url: url.trim() }));
  }

  return {
    ...merged,
    backgroundMedia,
    backgroundImages: backgroundMedia
      .filter((item) => item.type === "image")
      .map((item) => item.url),
  };
}

function mergeSettings(partial: Partial<SiteSettings> & { hero?: Partial<HeroFirestore> }): SiteSettings {
  return {
    hero: mergeHero(partial.hero),
    excursionsPreview: {
      ...DEFAULT_SITE_SETTINGS.excursionsPreview,
      ...partial.excursionsPreview,
    },
    packagesPreview: {
      ...DEFAULT_SITE_SETTINGS.packagesPreview,
      ...partial.packagesPreview,
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
    googleReviews: {
      ...DEFAULT_SITE_SETTINGS.googleReviews!,
      ...partial.googleReviews,
    },
    booking: (() => {
      const merged = {
        ...DEFAULT_SITE_SETTINGS.booking!,
        ...partial.booking,
      };
      if (
        (merged.hoursBeforeDeparture == null ||
          !Number.isFinite(merged.hoursBeforeDeparture)) &&
        typeof partial.booking?.shortHoldHours === "number"
      ) {
        merged.hoursBeforeDeparture = partial.booking.shortHoldHours;
      }
      return {
        orderHoldHours: merged.orderHoldHours,
        hoursBeforeDeparture: merged.hoursBeforeDeparture,
        holdWarningMessage: merged.holdWarningMessage ?? "",
      };
    })(),
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
