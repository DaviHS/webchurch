import { z } from "zod";
import { projectorModeSchema } from "./protocol";

export const REMOTE_CODE_LENGTH = 4;
export const REMOTE_POLL_MS = 800;
export const REMOTE_HEARTBEAT_MS = 5000;
export const REMOTE_STALE_SECONDS = 15;

export const remoteCodeSchema = z.string().regex(/^\d{4}$/, "O código tem 4 números");

export const REMOTE_MESSAGE_MAX = 200;

const remoteSlideSchema = z.object({
  text: z.string().max(2000),
  label: z.string().max(100),
});
export type RemoteSlide = z.infer<typeof remoteSlideSchema>;

export const remoteStateSchema = z.object({
  title: z.string().max(200),
  mode: projectorModeSchema,
  songTitle: z.string().max(200).nullable(),
  live: remoteSlideSchema.nullable(),
  next: remoteSlideSchema.nullable(),
  position: z.object({ song: z.number().int().min(0), slide: z.number().int().min(0) }).nullable(),
  projectorMessage: z.string().max(REMOTE_MESSAGE_MAX).optional(),
  stageMessage: z.string().max(REMOTE_MESSAGE_MAX).optional(),
});
export type RemoteState = z.infer<typeof remoteStateSchema>;

export const remoteOutlineSchema = z
  .array(
    z.object({
      title: z.string().max(200),
      kind: z.enum(["song", "bible"]).default("song"),
      slides: z.array(remoteSlideSchema).max(400),
    }),
  )
  .max(100);
export type RemoteOutline = z.infer<typeof remoteOutlineSchema>;

export const remoteCommandSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("next") }),
  z.object({ type: z.literal("previous") }),
  z.object({ type: z.literal("black") }),
  z.object({ type: z.literal("logo") }),
  z.object({ type: z.literal("clear") }),
  z.object({ type: z.literal("goto"), song: z.number().int().min(0), slide: z.number().int().min(0) }),
  z.object({ type: z.literal("addSong"), songId: z.number().int().positive() }),
  z.object({
    type: z.literal("addPassage"),
    reference: z.string().trim().min(1).max(60),
    version: z.string().trim().min(1).max(10),
    perSlide: z.number().int().min(1).max(6).nullable(),
  }),
  z.object({ type: z.literal("projectorMessage"), message: z.string().max(REMOTE_MESSAGE_MAX) }),
  z.object({ type: z.literal("stageMessage"), message: z.string().max(REMOTE_MESSAGE_MAX) }),
]);
export type RemoteCommand = z.infer<typeof remoteCommandSchema>;
