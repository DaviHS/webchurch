import { UTApi } from "uploadthing/server";
import { can, createTRPCRouter } from "@/server/api/trpc";
import { siteSettingsSchema } from "@/lib/site-settings";
import { getSiteSettings, saveSiteSettings } from "@/server/site-settings";
import { logError } from "@/server/log";

const manageSettings = can("settings.manage");

const uploadKey = (url: string) => /^https:\/\/[^/]+\.(?:ufs\.sh|utfs\.io)\/f\/([^/?#]+)/.exec(url)?.[1] ?? null;

export const siteRouter = createTRPCRouter({
  get: manageSettings.query(() => getSiteSettings()),

  update: manageSettings.input(siteSettingsSchema).mutation(async ({ input }) => {
    const previous = await getSiteSettings();
    await saveSiteSettings(input);

    const removed = previous.galleryImages.filter((url) => !input.galleryImages.includes(url));
    const keys = removed.flatMap((url) => uploadKey(url) ?? []);
    if (keys.length > 0) {
      try {
        await new UTApi().deleteFiles(keys);
      } catch (error) {
        logError("uploadthing: fotos removidas não apagadas", error);
      }
    }
    return { success: true };
  }),
});
