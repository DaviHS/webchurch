import type { RouterOutputs } from "@/types";

export type MemberListEntry = RouterOutputs["member"]["getAll"][number];

export type MemberWithMinistries = MemberListEntry["members"];

export type MemberStatus = MemberWithMinistries["status"];
