import type { BadgeProps } from "@/components/ui/badge";
import { eventTypes, type EventType } from "@/validators/event";

export const eventTypeLabels: Record<EventType, string> = {
  cult: "Culto",
  celebration: "Celebração",
  meeting: "Reunião",
  conference: "Conferência",
  rehearsal: "Ensaio",
  other: "Outro",
  template: "Template",
};

export const selectableEventTypes = eventTypes.filter(
  (type): type is Exclude<EventType, "template"> => type !== "template"
);

type BadgeVariant = NonNullable<BadgeProps["variant"]>;

const eventTypeBadgeVariants: Record<EventType, BadgeVariant> = {
  cult: "info",
  celebration: "success",
  meeting: "secondary",
  conference: "warning",
  rehearsal: "outline",
  other: "muted",
  template: "muted",
};

const isEventType = (type: string): type is EventType => (eventTypes as readonly string[]).includes(type);

export function getEventTypeBadgeVariant(type: string): BadgeVariant {
  return isEventType(type) ? eventTypeBadgeVariants[type] : "muted";
}
