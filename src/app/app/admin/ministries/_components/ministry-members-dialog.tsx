"use client";

import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { Users } from "lucide-react";
import { api } from "@/trpc/react";
import { skipToken } from "@tanstack/react-query";
import type { Ministry } from "./ministry-dialog";
import { MinistryMemberItem } from "./ministry-member-item";

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
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent size="sm">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="flex items-start gap-2">
            <Users className="mt-0.5 size-5 shrink-0" />
            <span className="min-w-0 break-words">Membros do ministério: {ministry.name}</span>
          </ResponsiveDialogTitle>
        </ResponsiveDialogHeader>

        <ResponsiveDialogBody className="pb-4 sm:pb-6">
          {isLoading ? (
            <LoadingState message="Carregando membros..." />
          ) : ministryMembers.length === 0 ? (
            <EmptyState icon={Users} title="Nenhum membro vinculado a este ministério" />
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total: {ministryMembers.length} membro(s)</p>
              {ministryMembers.map((member) => (
                <MinistryMemberItem key={member.memberId} member={member} />
              ))}
            </div>
          )}
        </ResponsiveDialogBody>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
