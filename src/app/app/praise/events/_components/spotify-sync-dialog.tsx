"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ErrorDisplay } from "@/components/ui/error-display";
import { LoadingState } from "@/components/ui/loading-state";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { toastError } from "@/lib/toast";
import { api } from "@/trpc/react";

interface SpotifySyncDialogProps {
  eventId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplied: () => Promise<unknown>;
}

export function SpotifySyncDialog({ eventId, open, onOpenChange, onApplied }: SpotifySyncDialogProps) {
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const { data, isLoading, error, refetch } = api.event.previewSpotifySync.useQuery(eventId, {
    enabled: open,
    refetchOnWindowFocus: false,
    gcTime: 0,
  });

  const apply = api.event.applySpotifySync.useMutation({
    onSuccess: async () => {
      await onApplied();
      toast.success("Repertório atualizado a partir do Spotify");
      onOpenChange(false);
    },
    onError: (mutationError) => toastError(mutationError.message),
  });

  const toggle = (trackId: string, included: boolean) =>
    setExcluded((current) => {
      const next = new Set(current);
      if (included) next.delete(trackId);
      else next.add(trackId);
      return next;
    });

  const handleApply = () => {
    if (!data) return;
    apply.mutate({
      eventId,
      items: data.items
        .filter((item) => !excluded.has(item.id))
        .map((item) =>
          item.songId !== null
            ? { songId: item.songId, create: null }
            : { songId: null, create: { title: item.name, artist: item.artist, trackId: item.id } },
        ),
    });
  };

  const included = data?.items.filter((item) => !excluded.has(item.id)).length ?? 0;
  const removed = data?.removed ?? [];

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent size="lg">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Atualizar repertório pelo Spotify</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            O repertório passa a seguir a playlist, na mesma ordem. Confira o que muda antes de aplicar.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <ResponsiveDialogBody className="space-y-4 pb-4">
          {isLoading ? (
            <LoadingState />
          ) : error ? (
            <ErrorDisplay message={error.message} onRetry={() => void refetch()} className="mt-0" />
          ) : data ? (
            <>
              {data.items.length === 0 && (
                <p className="text-sm text-muted-foreground">A playlist está vazia. Aplicar deixa o repertório sem músicas.</p>
              )}
              <ul className="divide-y rounded-md border">
                {data.items.map((item, index) => (
                  <li key={item.id} className="flex items-start gap-3 p-3 text-sm">
                    <Checkbox
                      checked={!excluded.has(item.id)}
                      onCheckedChange={(value) => toggle(item.id, value === true)}
                      aria-label={`Incluir ${item.name}`}
                      className="mt-1"
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="break-words font-medium">
                        {index + 1}. {item.name}
                        {item.artist && <span className="font-normal text-muted-foreground"> – {item.artist}</span>}
                      </p>
                      {item.status === "match" && <Badge variant="secondary">Já cadastrada</Badge>}
                      {item.status === "version" && (
                        <div className="space-y-1">
                          <Badge variant="outline">Outra versão</Badge>
                          <p className="text-xs text-muted-foreground">
                            Usa a música “{item.songTitle}” já cadastrada, com a letra dela. A faixa do Spotify cadastrada nela não muda.
                          </p>
                        </div>
                      )}
                      {item.status === "new" && (
                        <div className="space-y-1">
                          <Badge variant="outline" className="border-warning/60">
                            Não cadastrada
                          </Badge>
                          <p className="text-xs text-muted-foreground">
                            Será cadastrada como Louvor, sem letra. Complete na tela de Músicas. Desmarque para deixar de fora.
                          </p>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>

              {removed.length > 0 && (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm" role="status">
                  <p className="font-medium">
                    {removed.length === 1 ? "1 música sai do repertório" : `${removed.length} músicas saem do repertório`}:{" "}
                    {removed.map((row) => row.title).join(", ")}.
                  </p>
                  <p className="text-muted-foreground">O líder e as observações dela neste evento também se perdem.</p>
                </div>
              )}
            </>
          ) : null}
        </ResponsiveDialogBody>

        <ResponsiveDialogFooter>
          <ResponsiveDialogClose asChild>
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </ResponsiveDialogClose>
          <Button type="button" disabled={!data || apply.isPending} onClick={handleApply}>
            {apply.isPending && <Loader2 className="mr-1 animate-spin" />}
            Aplicar ({included})
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
