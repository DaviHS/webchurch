import { Card, CardContent } from "@/components/ui/card";
import { fullName } from "@/lib/formatters";
import type { RouterOutputs } from "@/types";
import { MemberStatusBadge } from "../../members/_components/member-status-badge";

export type MinistryMember = RouterOutputs["ministry"]["getMinistryMembers"][number];

export function MinistryMemberItem({ member }: { member: MinistryMember }) {
  return (
    <Card>
      <CardContent className="space-y-1 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="min-w-0 break-words font-medium">{fullName(member)}</span>
          <MemberStatusBadge status={member.status} />
        </div>
        {member.functionName && (
          <p className="break-words text-sm text-muted-foreground">
            <span className="font-medium">Função:</span> {member.functionName}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
