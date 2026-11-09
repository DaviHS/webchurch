"use client";

import { useState } from "react";
import { keepPreviousData } from "@tanstack/react-query";
import { Loader2, Merge, Music, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ErrorDisplay } from "@/components/ui/error-display";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { PageContainer, PageHeader } from "@/components/page-header";
import { useDebounce } from "@/hooks/use-debounce";
import { useEntityDialog } from "@/hooks/use-entity-dialog";
import { usePermissions } from "@/hooks/use-permissions";
import { useSongMutations } from "@/hooks/use-song-mutations";
import { api } from "@/trpc/react";
import { isSongCategory } from "@/validators/song";
import type { Song } from "@/types";
import type { SongFormData } from "@/validators/song";
import { AddToEventDialog } from "../_components/add-to-event-dialog";
import { DuplicateSongsDialog } from "./_components/duplicate-songs-dialog";
import { LastExecutionsDialog } from "./_components/last-executions-dialog";
import { LyricsDialog } from "./_components/lyrics-dialog";
import { SongCard } from "./_components/song-card";
import { SongEmptyState } from "./_components/song-empty-state";
import { SongFilters, type SongSort } from "./_components/song-filters";
import { SongForm } from "./_components/song-form";
import { SongGridSkeleton } from "./_components/song-grid-skeleton";
import { SpotifyStatus } from "./_components/spotify-status";
import { YouTubeStatus } from "./_components/youtube-status";

const PAGE_SIZE = 24;

export default function SongsPage() {
  const canEdit = usePermissions().can("songs.edit");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState<SongSort>("recent");
  const [noLyrics, setNoLyrics] = useState(false);
  const [lyricsDialogOpen, setLyricsDialogOpen] = useState(false);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [historySong, setHistorySong] = useState<Song | null>(null);
  const [addingSong, setAddingSong] = useState<Song | null>(null);
  const [duplicatesOpen, setDuplicatesOpen] = useState(false);

  const { data: duplicateGroups } = api.song.duplicateGroups.useQuery(undefined, { staleTime: 60_000 });
  const { data: facets } = api.song.facets.useQuery(undefined, { staleTime: 60_000 });

  const songDialog = useEntityDialog<Song>({ fromUrl: true });
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading, isFetching, isFetchingNextPage, fetchNextPage, hasNextPage, isError, error: listError, refetch } =
    api.song.list.useInfiniteQuery(
      {
        search: debouncedSearch,
        category: category === "" ? undefined : category,
        sort: sort === "noYoutube" || sort === "noSpotify" ? "recent" : sort,
        noLyrics: noLyrics || undefined,
        missingLink: sort === "noYoutube" ? "youtube" : sort === "noSpotify" ? "spotify" : undefined,
        limit: PAGE_SIZE,
      },
      { getNextPageParam: (last) => last.nextCursor, placeholderData: keepPreviousData },
    );

  const { handleSubmit, handleDelete, isPending } = useSongMutations({
    onSuccess: songDialog.close,
  });

  const editingSong = songDialog.editing;

  const handleFormSubmit = (formData: SongFormData) => {
    void handleSubmit(formData, editingSong);
  };

  const initialFormData = editingSong
    ? {
        ...editingSong,
        category: isSongCategory(editingSong.category) ? editingSong.category : undefined,
      }
    : undefined;

  const handleViewLyrics = (song: Song) => {
    setSelectedSong(song);
    setLyricsDialogOpen(true);
  };

  const handleViewHistory = (song: Song) => {
    setHistorySong(song);
    setHistoryDialogOpen(true);
  };

  const songs: Song[] = (data?.pages ?? []).flatMap((page) =>
    page.songs.map((song) => ({
      ...song,
      artist: song.artist ?? "",
      lyrics: song.lyrics ?? undefined,
      chords: song.chords ?? undefined,
      duration: song.duration ?? undefined,
      youtubeUrl: song.youtubeUrl ?? undefined,
      youtubeVideoId: song.youtubeVideoId ?? undefined,
      spotifyUrl: song.spotifyUrl ?? undefined,
      spotifyTrackId: song.spotifyTrackId ?? undefined,
    })),
  );
  const total = data?.pages[0]?.total ?? 0;
  const isFiltered = debouncedSearch !== "" || category !== "" || noLyrics || sort === "noYoutube" || sort === "noSpotify";

  return (
    <PageContainer>
      {selectedSong && (
        <LyricsDialog
          song={selectedSong}
          open={lyricsDialogOpen}
          onOpenChange={setLyricsDialogOpen}
          onEdit={canEdit ? songDialog.openEdit : undefined}
        />
      )}

      <DuplicateSongsDialog open={duplicatesOpen} onOpenChange={setDuplicatesOpen} />

      {historySong && (
        <LastExecutionsDialog song={historySong} open={historyDialogOpen} onOpenChange={setHistoryDialogOpen} />
      )}

      <AddToEventDialog song={addingSong} open={addingSong !== null} onOpenChange={(open) => !open && setAddingSong(null)} />

      <ResponsiveDialog open={songDialog.open && canEdit} onOpenChange={songDialog.onOpenChange}>
        <ResponsiveDialogContent size="lg">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>{songDialog.isEditing ? "Editar música" : "Nova música"}</ResponsiveDialogTitle>
          </ResponsiveDialogHeader>
          <SongForm
            key={editingSong?.id ?? "new"}
            onSubmit={handleFormSubmit}
            initialData={initialFormData}
            isLoading={isPending}
            onCancel={songDialog.close}
          />
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      <PageHeader
        title="Músicas"
        icon={Music}
        description="Repertório do ministério de louvor."
        actions={
          // No celular, "Nova música" fica no botão + do menu de baixo; aqui só aparece em telas maiores.
          canEdit ? (
            <Button onClick={songDialog.openCreate} className="hidden sm:inline-flex">
              <Plus />
              Nova música
            </Button>
          ) : undefined
        }
      />

      {canEdit && duplicateGroups && duplicateGroups.length > 0 && (
        <button
          type="button"
          onClick={() => setDuplicatesOpen(true)}
          className="flex min-h-11 w-full items-center gap-2 rounded-md border border-warning/40 bg-warning/10 px-3 text-left text-sm sm:w-auto"
        >
          <Merge className="size-4 shrink-0 text-warning" />
          <span>
            <span className="font-medium">{duplicateGroups.length}</span> {duplicateGroups.length === 1 ? "grupo de músicas parece duplicado" : "grupos de músicas parecem duplicados"}
            <span className="font-medium text-primary"> · Revisar</span>
          </span>
        </button>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <YouTubeStatus />
        <SpotifyStatus />
      </div>

      <Card>
        <CardHeader className="p-4 pb-3 sm:p-6 sm:pb-3">
          <SongFilters
            search={search}
            onSearchChange={setSearch}
            category={category}
            onCategoryChange={setCategory}
            sort={sort}
            onSortChange={setSort}
            noLyrics={noLyrics}
            onNoLyricsChange={setNoLyrics}
            isSearching={isFetching && !isFetchingNextPage && search !== ""}
            availableCategories={facets?.categories ?? []}
            noLyricsCount={facets?.noLyricsCount ?? 0}
            noYoutubeCount={facets?.noYoutubeCount ?? 0}
            noSpotifyCount={facets?.noSpotifyCount ?? 0}
          />
        </CardHeader>

        <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
          {isError && !data ? (
            <ErrorDisplay title="Não foi possível carregar as músicas" message={listError.message} onRetry={() => void refetch()} className="mt-0" />
          ) : isLoading ? (
            <SongGridSkeleton />
          ) : songs.length > 0 ? (
            <>
              <p className="text-xs text-muted-foreground">
                {total} {total === 1 ? "música" : "músicas"}
                {isFiltered ? " encontradas" : ""}
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {songs.map((song) => (
                  <SongCard
                    key={song.id}
                    song={song}
                    search={debouncedSearch}
                    onEdit={songDialog.openEdit}
                    onDelete={(target) => void handleDelete(target)}
                    onViewLyrics={handleViewLyrics}
                    onViewHistory={handleViewHistory}
                    onAddToEvent={setAddingSong}
                  />
                ))}
              </div>

              {hasNextPage && (
                <Button type="button" variant="outline" className="w-full" disabled={isFetchingNextPage} onClick={() => void fetchNextPage()}>
                  {isFetchingNextPage ? <Loader2 className="animate-spin" /> : null}
                  Carregar mais ({Math.max(0, total - songs.length)})
                </Button>
              )}
            </>
          ) : (
            <SongEmptyState onCreateClick={canEdit ? songDialog.openCreate : undefined} filtered={isFiltered} />
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
