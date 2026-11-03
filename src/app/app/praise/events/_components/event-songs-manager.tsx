"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Music, Plus, Trash2, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useConfirm } from "@/components/confirm-dialog";
import { SearchInput } from "@/components/search-input";
import { useDebounce } from "@/hooks/use-debounce";
import { fullName } from "@/lib/formatters";
import { songCategoryLabel } from "@/lib/labels";
import { mutationFeedback } from "@/lib/mutation-feedback";
import { api } from "@/trpc/react";
import type { EventSong, RouterOutputs } from "@/types";
import { CollapsibleAddPanel } from "./collapsible-add-panel";
import { SearchPickList, SelectedPick } from "./search-pick-list";

type SongOption = RouterOutputs["song"]["list"]["songs"][number];

const NO_LEADER = "none";

interface EventSongsManagerProps {
  eventId: number;
  songs: EventSong[];
  onUpdate: () => void;
}

function SongSummary({ title, artist, category }: { title: string; artist: string | null; category: string | null }) {
  return (
    <>
      <span className="block w-full truncate font-medium">{title}</span>
      <span className="flex w-full min-w-0 items-center gap-2 text-sm text-muted-foreground">
        <span className="truncate">{artist}</span>
        {category && (
          <Badge variant="outline" className="shrink-0 text-xs">
            {songCategoryLabel(category)}
          </Badge>
        )}
      </span>
    </>
  );
}

export function EventSongsManager({ eventId, songs, onUpdate }: EventSongsManagerProps) {
  const confirm = useConfirm();
  const [selectedSong, setSelectedSong] = useState<SongOption | null>(null);
  const [leaderId, setLeaderId] = useState(NO_LEADER);
  const [notes, setNotes] = useState("");
  const [songSearch, setSongSearch] = useState("");

  const debouncedSongSearch = useDebounce(songSearch, 300);
  const { data: songsData, isLoading: isLoadingSongs } = api.song.list.useQuery({
    search: debouncedSongSearch || undefined,
    limit: 50,
  });

  const { data: membersData } = api.member.list.useQuery({ limit: 100 });
  const allMembers = membersData?.map((item) => item.members) ?? [];

  const availableSongs = (songsData?.songs ?? []).filter(
    (song) => !songs.some((eventSong) => eventSong.songId === song.id)
  );
  const sortedSongs = [...songs].sort((a, b) => a.order - b.order);

  const resetForm = () => {
    setSelectedSong(null);
    setLeaderId(NO_LEADER);
    setNotes("");
    setSongSearch("");
  };

  const addSongMutation = api.event.addSong.useMutation(
    mutationFeedback({
      success: "Música adicionada com sucesso",
      error: "Erro ao adicionar música",
      onSuccess: () => {
        resetForm();
        onUpdate();
      },
    })
  );

  const removeSongMutation = api.event.removeSong.useMutation(
    mutationFeedback({
      success: "Música removida com sucesso",
      error: "Erro ao remover música",
      onSuccess: onUpdate,
    })
  );

  const updateSongOrderMutation = api.event.updateSongOrder.useMutation();

  const moveSongMutation = useMutation({
    mutationFn: ({ current, target }: { current: { id: number; order: number }; target: { id: number; order: number } }) =>
      Promise.all([
        updateSongOrderMutation.mutateAsync({ eventSongId: current.id, newOrder: current.order }),
        updateSongOrderMutation.mutateAsync({ eventSongId: target.id, newOrder: target.order }),
      ]),
    ...mutationFeedback({
      success: "Ordem atualizada com sucesso",
      error: "Erro ao atualizar ordem",
      onSuccess: onUpdate,
    }),
  });

  const handleAddSong = () => {
    if (!selectedSong) return;
    const nextOrder = songs.length > 0 ? Math.max(...songs.map((s) => s.order)) + 1 : 1;
    addSongMutation.mutate({
      eventId,
      songId: selectedSong.id,
      order: nextOrder,
      leaderId: leaderId === NO_LEADER ? undefined : parseInt(leaderId),
      notes: notes || undefined,
    });
  };

  const handleRemoveSong = async (song: EventSong) => {
    const confirmed = await confirm({
      title: "Remover música?",
      description: `"${song.song?.title ?? "Esta música"}" será removida do repertório.`,
      confirmLabel: "Remover",
      destructive: true,
    });
    if (confirmed) removeSongMutation.mutate(song.id);
  };

  const handleMoveSong = (songIndex: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? songIndex - 1 : songIndex + 1;
    const current = sortedSongs[songIndex];
    const target = sortedSongs[newIndex];
    if (!current || !target) return;

    const [currentOrder, targetOrder] =
      current.order === target.order ? [newIndex + 1, songIndex + 1] : [target.order, current.order];

    moveSongMutation.mutate({
      current: { id: current.id, order: currentOrder },
      target: { id: target.id, order: targetOrder },
    });
  };

  const handleSelectSong = (song: SongOption) => {
    setSelectedSong(song);
    setSongSearch("");
  };

  return (
    <div className="space-y-4">
      <CollapsibleAddPanel title="Adicionar música">
        <div className="space-y-2">
          <Label>Música</Label>
          {selectedSong ? (
            <SelectedPick onClear={() => setSelectedSong(null)} clearLabel="Trocar música">
              <SongSummary title={selectedSong.title} artist={selectedSong.artist} category={selectedSong.category} />
            </SelectedPick>
          ) : (
            <>
              <SearchInput
                value={songSearch}
                onChange={setSongSearch}
                placeholder="Buscar música…"
                isLoading={songSearch !== debouncedSongSearch}
              />
              <SearchPickList
                label="Músicas disponíveis"
                items={availableSongs}
                isLoading={isLoadingSongs}
                getKey={(song) => song.id}
                onSelect={handleSelectSong}
                emptyMessage={songSearch ? "Nenhuma música encontrada" : "Nenhuma música disponível"}
                renderItem={(song) => <SongSummary title={song.title} artist={song.artist} category={song.category} />}
              />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="leader-select">Líder (opcional)</Label>
            <Select value={leaderId} onValueChange={setLeaderId}>
              <SelectTrigger id="leader-select">
                <SelectValue placeholder="Sem líder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_LEADER}>Sem líder</SelectItem>
                {allMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id.toString()}>
                    {fullName(member)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="song-notes">Observações</Label>
            <Input
              id="song-notes"
              placeholder="Notas sobre a música…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleAddSong}
            disabled={!selectedSong || addSongMutation.isPending}
            className="w-full sm:w-auto"
          >
            <Plus />
            Adicionar
          </Button>
        </div>
      </CollapsibleAddPanel>

      <Card>
        <CardContent className="p-4">
          <h3 className="mb-4 flex items-center gap-2 font-semibold">
            <Music className="size-5" />
            Repertório ({songs.length} músicas)
          </h3>

          {sortedSongs.length === 0 ? (
            <EmptyState
              icon={Music}
              title="Nenhuma música adicionada"
              description="Adicione músicas usando o formulário acima."
              className="py-8"
            />
          ) : (
            <ul className="space-y-2">
              {sortedSongs.map((song, index) => (
                <li key={song.id} className="flex items-center gap-2 rounded-lg border p-2 sm:gap-3 sm:p-3">
                  <div className="flex shrink-0 flex-col gap-1">
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => handleMoveSong(index, "up")}
                      title="Mover para cima"
                      aria-label="Mover para cima"
                      disabled={index === 0 || moveSongMutation.isPending}
                    >
                      <ArrowUp />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => handleMoveSong(index, "down")}
                      title="Mover para baixo"
                      aria-label="Mover para baixo"
                      disabled={index === sortedSongs.length - 1 || moveSongMutation.isPending}
                    >
                      <ArrowDown />
                    </Button>
                  </div>

                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                    {song.order}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{song.song?.title ?? "Música não encontrada"}</p>
                    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                      <span className="truncate">{song.song?.artist ?? "Artista desconhecido"}</span>
                      {song.song?.category && (
                        <Badge variant="outline" className="text-xs">
                          {songCategoryLabel(song.song.category)}
                        </Badge>
                      )}
                    </div>
                    {song.leader && (
                      <p className="mt-1 flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
                        <User className="size-3 shrink-0" />
                        <span className="truncate">Líder: {fullName(song.leader)}</span>
                      </p>
                    )}
                    {song.notes && <p className="mt-1 break-words text-xs text-muted-foreground">{song.notes}</p>}
                  </div>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleRemoveSong(song)}
                    disabled={removeSongMutation.isPending}
                    className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    title="Remover música"
                    aria-label="Remover música"
                  >
                    <Trash2 />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
