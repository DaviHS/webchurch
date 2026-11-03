import type { RouterOutputs } from "./api";

export type EventData = RouterOutputs["event"]["list"]["events"][number];

export type EventWithDetails = NonNullable<RouterOutputs["event"]["getById"]>;

export type EventSong = EventWithDetails["songs"][number];

export type EventParticipant = EventWithDetails["participants"][number];
