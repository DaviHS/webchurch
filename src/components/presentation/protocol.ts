import { z } from "zod";
import { THEME_IDS } from "./themes";

export const PRESENTATION_CHANNEL = "webchurch-presentation";

export const outputRoleSchema = z.enum(["projector", "stage"]);
export type OutputRole = z.infer<typeof outputRoleSchema>;

export const OUTPUT_ROLES = outputRoleSchema.options;

export const OUTPUT_LABELS: Record<OutputRole, string> = {
  projector: "Projetor",
  stage: "Retorno",
};

export const OUTPUT_PATHS: Record<OutputRole, string> = {
  projector: "/presentation/projector",
  stage: "/presentation/stage",
};

export const projectorModeSchema = z.enum(["live", "black", "logo", "clear"]);
export type ProjectorMode = z.infer<typeof projectorModeSchema>;

const slideSchema = z.object({
  text: z.string(),
  label: z.string(),
});
export type SlidePayload = z.infer<typeof slideSchema>;

const stateMessageSchema = z.object({
  type: z.literal("STATE"),
  mode: projectorModeSchema,
  live: slideSchema.nullable(),
  next: slideSchema.nullable(),
  song: z
    .object({
      title: z.string(),
      artist: z.string().nullable(),
      position: z.number().int(),
      total: z.number().int(),
    })
    .nullable(),
  nextSongTitle: z.string().nullable(),
  stageMessage: z.string(),
  projectorMessage: z.string().optional(),
  timerStartedAt: z.number().nullable(),
  theme: z.enum(THEME_IDS).optional(),
  video: z.object({ id: z.string().min(11).max(11), playing: z.boolean(), blocked: z.boolean().optional() }).nullable().optional(),
});
export type PresentationState = z.infer<typeof stateMessageSchema>;

const helloMessageSchema = z.object({
  type: z.literal("HELLO"),
  role: outputRoleSchema,
});

const byeMessageSchema = z.object({
  type: z.literal("BYE"),
  role: outputRoleSchema,
});

const commandMessageSchema = z.object({
  type: z.literal("COMMAND"),
  command: z.enum(["next", "previous", "black", "logo", "clear"]),
});
export type PresentationCommand = z.infer<typeof commandMessageSchema>["command"];

const operatorOfflineSchema = z.object({
  type: z.literal("OPERATOR_OFFLINE"),
});

const videoBlockedSchema = z.object({
  type: z.literal("VIDEO_BLOCKED"),
  id: z.string().min(11).max(11),
});

const videoSeekSchema = z.object({
  type: z.literal("VIDEO_SEEK"),
  delta: z.number(),
});

const closeMessageSchema = z.object({
  type: z.literal("CLOSE"),
});

export const presentationMessageSchema = z.discriminatedUnion("type", [
  stateMessageSchema,
  helloMessageSchema,
  byeMessageSchema,
  commandMessageSchema,
  operatorOfflineSchema,
  closeMessageSchema,
  videoBlockedSchema,
  videoSeekSchema,
]);

export type PresentationMessage = z.infer<typeof presentationMessageSchema>;

export const HEARTBEAT_MS = 3000;
export const CONNECTION_TIMEOUT_MS = 8000;
