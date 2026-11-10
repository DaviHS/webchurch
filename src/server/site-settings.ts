import { DEFAULT_SITE_SETTINGS, siteSettingsSchema, type SiteSettings } from "@/lib/site-settings";
import { getSetting, setSetting } from "@/server/settings";

export const SETTING_SITE = "site_settings";

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const raw = await getSetting(SETTING_SITE);
    if (!raw) return DEFAULT_SITE_SETTINGS;
    const parsed = siteSettingsSchema.safeParse({ ...DEFAULT_SITE_SETTINGS, ...(JSON.parse(raw) as object) });
    return parsed.success ? parsed.data : DEFAULT_SITE_SETTINGS;
  } catch {
    return DEFAULT_SITE_SETTINGS;
  }
}

export async function saveSiteSettings(settings: SiteSettings): Promise<void> {
  await setSetting(SETTING_SITE, JSON.stringify(settings));
}
