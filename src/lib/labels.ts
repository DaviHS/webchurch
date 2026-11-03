import type { BadgeProps } from "@/components/ui/badge";
import { eventTypes, type EventType } from "@/validators/event";
import { songCategories, type SongCategory } from "@/validators/song";

type BadgeVariant = NonNullable<BadgeProps["variant"]>;

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  cult: "Culto",
  celebration: "Celebração",
  meeting: "Reunião",
  conference: "Conferência",
  rehearsal: "Ensaio",
  other: "Outro",
  template: "Modelo",
};

const EVENT_TYPE_BADGES: Record<EventType, BadgeVariant> = {
  cult: "info",
  celebration: "success",
  meeting: "secondary",
  conference: "warning",
  rehearsal: "outline",
  other: "muted",
  template: "muted",
};

export const SELECTABLE_EVENT_TYPES = eventTypes.filter(
  (type): type is Exclude<EventType, "template"> => type !== "template"
);

export const isEventType = (value: string): value is EventType => (eventTypes as readonly string[]).includes(value);

export const eventTypeLabel = (value: string): string => (isEventType(value) ? EVENT_TYPE_LABELS[value] : value);

export const eventTypeBadge = (value: string): BadgeVariant => (isEventType(value) ? EVENT_TYPE_BADGES[value] : "muted");

export const SONG_CATEGORY_LABELS: Record<SongCategory, string> = {
  hymn: "Hino",
  praise: "Louvor",
  worship: "Adoração",
  chorus: "Coro",
  special: "Especial",
};

export const songCategoryLabel = (value: string): string =>
  (songCategories as readonly string[]).includes(value) ? SONG_CATEGORY_LABELS[value as SongCategory] : value;
