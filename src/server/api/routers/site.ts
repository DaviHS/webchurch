import { can, createTRPCRouter } from "@/server/api/trpc";
import { siteSettingsSchema } from "@/lib/site-settings";
import { getSiteSettings, saveSiteSettings } from "@/server/site-settings";

const manageSettings = can("settings.manage");

export const siteRouter = createTRPCRouter({
  get: manageSettings.query(() => getSiteSettings()),

  update: manageSettings.input(siteSettingsSchema).mutation(async ({ input }) => {
    await saveSiteSettings(input);
    return { success: true };
  }),
});
