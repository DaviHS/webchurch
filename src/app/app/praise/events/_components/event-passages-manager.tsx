"use client";

import { useState } from "react";
import { BookOpen, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBibleVersion } from "@/hooks/use-bible-version";
import { usePermissions } from "@/hooks/use-permissions";
import { mutationFeedback } from "@/lib/mutation-feedback";
import { api } from "@/trpc/react";
import type { RouterOutputs } from "@/types";

type EventPassage = NonNullable<RouterOutputs["event"]["getById"]>["passages"][number];
type Placement = "before" | "after";

const PLACEMENT_LABELS: Record<Placement, string> = { before: "No início", after: "No final" };

interface EventPassagesManagerProps {
  eventId: number;
  passages: EventPassage[];
  onUpdate: () => void;
}

export function EventPassagesManager({ eventId, passages, onUpdate }: EventPassagesManagerProps) {
  const { can } = usePermissions();
  const canEdit = can("events.edit");
  const { data: versions } = api.bible.versions.useQuery(undefined, { staleTime: Infinity });
  const [version, setVersion] = useBibleVersion(versions);
  const [reference, setReference] = useState("");
  const [placement, setPlacement] = useState<Placement>("after");

  const addMutation = api.event.addPassage.useMutation(
    mutationFeedback({
      success: "Passagem adicionada",
      error: "Erro ao adicionar passagem",
      onSuccess: () => {
        setReference("");
        onUpdate();
      },
    }),
  );

  const removeMutation = api.event.removePassage.useMutation(
    mutationFeedback({ success: "Passagem removida", error: "Erro ao remover passagem", onSuccess: onUpdate }),
  );

  const canAdd = reference.trim().length >= 2 && version !== null && !addMutation.isPending;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canAdd || !version) return;
    addMutation.mutate({ eventId, reference: reference.trim(), versionCode: version, placement });
  };

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <h3 className="flex items-center gap-2 font-semibold">
          <BookOpen className="size-5" />
          Passagens bíblicas ({passages.length})
        </h3>

        {canEdit && (
          <form className="grid gap-2 sm:grid-cols-[1fr_9rem_9rem_auto]" onSubmit={submit}>
            <Input
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              placeholder="Ex.: Salmo 23 ou Jo 3:16-18"
              autoCapitalize="none"
              autoCorrect="off"
              aria-label="Passagem bíblica"
            />
            <Select value={version ?? undefined} onValueChange={setVersion}>
              <SelectTrigger className="w-full" aria-label="Versão">
                <SelectValue placeholder="Versão" />
              </SelectTrigger>
              <SelectContent className="max-h-80">
                {versions?.map((v) => (
                  <SelectItem key={v.code} value={v.code}>
                    {v.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={placement} onValueChange={(value) => setPlacement(value === "before" ? "before" : "after")}>
              <SelectTrigger className="w-full" aria-label="Posição no repertório">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="before">{PLACEMENT_LABELS.before}</SelectItem>
                <SelectItem value="after">{PLACEMENT_LABELS.after}</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" disabled={!canAdd}>
              <Plus />
              Adicionar
            </Button>
          </form>
        )}

        {passages.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma passagem. Elas entram na projeção no início ou no final das músicas.
          </p>
        ) : (
          <ul className="space-y-2">
            {passages.map((passage) => (
              <li key={passage.id} className="flex items-center gap-3 rounded-lg border p-2 sm:p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{passage.reference}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="outline" className="text-xs">
                      {passage.versionCode}
                    </Badge>
                    <span>{passage.placement === "before" ? PLACEMENT_LABELS.before : PLACEMENT_LABELS.after}</span>
                  </div>
                </div>
                {canEdit && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removeMutation.mutate(passage.id)}
                    disabled={removeMutation.isPending}
                    className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    title="Remover passagem"
                    aria-label="Remover passagem"
                  >
                    <Trash2 />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
