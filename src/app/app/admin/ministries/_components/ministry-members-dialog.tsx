"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { Users } from "lucide-react";
import { api } from "@/trpc/react";
import { skipToken } from "@tanstack/react-query";
import type { Ministry } from "./ministry-dialog";
import { MemberStatusBadge } from "../../members/_components/member-status-badge";

interface MinistryMembersDialogProps {
  ministry: Ministry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MinistryMembersDialog({ ministry, open, onOpenChange }: MinistryMembersDialogProps) {
  const { data: ministryMembers = [], isLoading } = api.ministry.getMinistryMembers.useQuery(
    ministry && open ? { ministryId: ministry.id } : skipToken
  );

  if (!ministry) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Membros do ministério: {ministry.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <LoadingState message="Carregando membros..." />
          ) : ministryMembers.length === 0 ? (
            <EmptyState icon={Users} title="Nenhum membro vinculado a este ministério" />
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Total: {ministryMembers.length} membro(s)
              </p>
              {ministryMembers.map((member) => (
                <Card key={member.memberId}>
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">
                            {member.firstName} {member.lastName}
                          </span>
                          <MemberStatusBadge status={member.status} />
                        </div>
                        {member.functionName && (
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium">Função:</span> {member.functionName}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}