import type { RouterOutputs } from "@/types";

export type MemberListEntry = RouterOutputs["member"]["list"][number];

export type MemberWithMinistries = MemberListEntry["members"];

export type MemberStatus = MemberWithMinistries["status"];
