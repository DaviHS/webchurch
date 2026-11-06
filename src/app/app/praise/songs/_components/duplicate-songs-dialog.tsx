"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Merge } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { useConfirm } from "@/components/confirm-dialog";
import { mutationFeedback } from "@/lib/mutation-feedback";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import type { RouterOutputs } from "@/types";

type Group = RouterOutputs["song"]["duplicateGroups"][number];

const bestToKeep = (group: Group) =>
  [...group].sort((a, b) => b.events - a.events || Number(b.hasLyrics) - Number(a.hasLyrics) || a.id - b.id)[0]!.id;

function GroupCard({ group, onMerge, busy }: { group: Group; onMerge: (keepId: number, removeIds: number[]) => void; busy: boolean }) {
  const [keepId, setKeepId] = useState(() => bestToKeep(group));

  return (
    <div className="space-y-2 rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">Escolha qual manter. As outras serão mescladas nela.</p>
      <div role="radiogroup" className="space-y-1.5">
        {group.map((song) => (
          <button
            key={song.id}
            type="button"
            role="radio"
            aria-checked={song.id === keepId}
            onClick={() => setKeepId(song.id)}
            className={cn(
              "flex w-full flex-col items-start gap-0.5 rounded-md border-2 p-2 text-left text-sm",
              song.id === keepId ? "border-primary bg-primary/10" : "border-border hover:bg-accent",
            )}
          >
            <span className="font-medium">
              {song.title}
              {song.artist ? ` · ${song.artist}` : ""}
            </span>
            <span className="text-xs text-muted-foreground">
              #{song.id} · {song.hasLyrics ? "com letra" : "sem letra"} · {song.hasVideo ? "com YouTube" : "sem YouTube"} ·{" "}
              {song.events} evento(s)
            </span>
          </button>
        ))}
      </div>
      <Button
        type="button"
        size="sm"
        disabled={busy}
        onClick={() =>
          onMerge(
            keepId,
            group.filter((song) => song.id !== keepId).map((song) => song.id),
          )
        }
      >
        <Merge className="mr-1" /> Mesclar
      </Button>
    </div>
  );
}

export function DuplicateSongsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const utils = api.useUtils();
  const confirm = useConfirm();
  const { data: groups } = api.song.duplicateGroups.useQuery(undefined, { enabled: open });

  const merge = api.song.merge.useMutation(
    mutationFeedback({
      loading: "Mesclando músicas...",
      success: ({ merged }) => `${merged} música(s) mesclada(s)`,
      error: "Erro ao mesclar",
      onSuccess: async ({ warnings }) => {
        for (const warning of warnings) toast.warning(warning, { duration: 10_000 });
        await Promise.all([utils.song.duplicateGroups.invalidate(), utils.song.list.invalidate()]);
      },
    }),
  );

  const handleMerge = async (keepId: number, removeIds: number[]) => {
    const confirmed = await confirm({
      title: "Mesclar músicas",
      description:
        "Os eventos das outras músicas passam para a escolhida, campos vazios dela são completados e as demais são excluídas. Não dá para desfazer.",
      confirmLabel: "Mesclar",
      destructive: true,
    });
    if (confirmed) merge.mutate({ keepId, removeIds });
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent size="lg">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Músicas duplicadas</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>Mesmo título e artista, ignorando acentos e maiúsculas.</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody className="space-y-3 pb-4">
          {groups?.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma música duplicada.</p>}
          {groups?.map((group) => (
            <GroupCard
              key={group.map((song) => song.id).join("-")}
              group={group}
              busy={merge.isPending}
              onMerge={(keepId, removeIds) => void handleMerge(keepId, removeIds)}
            />
          ))}
        </ResponsiveDialogBody>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
