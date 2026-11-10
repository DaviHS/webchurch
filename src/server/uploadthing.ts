import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@/server/auth";
import { loadAccess } from "@/server/access";

const f = createUploadthing();

export const uploadRouter = {
  galleryImage: f({ image: { maxFileSize: "8MB", maxFileCount: 12 } })
    .middleware(async () => {
      const session = await auth();
      const userId = Number(session?.user?.id);
      const access = Number.isInteger(userId) ? await loadAccess(userId) : null;
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      if (!access?.permissions.has("settings.manage")) throw new UploadThingError("Você não tem permissão para enviar fotos.");
      return { userId };
    })
    .onUploadComplete(({ file }) => ({ url: file.ufsUrl })),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
