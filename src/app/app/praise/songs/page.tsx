"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { api } from "@/trpc/react";
import { Merge, Music, Plus } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page-header";
import { PaginationBar } from "@/components/pagination-bar";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { SongForm } from "./_components/song-form";
import { isSongCategory } from "@/validators/song";
import { LyricsDialog } from "./_components/lyrics-dialog";
import { YouTubePlayer } from "./_components/youtube-player";
import { YouTubeStatus } from "./_components/youtube-status";
import { SpotifyPlayer } from "./_components/spotify-player";
import { SpotifyStatus } from "./_components/spotify-status";
import { LastExecutionsDialog } from "./_components/last-executions-dialog";
import { DuplicateSongsDialog } from "./_components/duplicate-songs-dialog";
import { SongCard } from "./_components/song-card";
import { SongFilters } from "./_components/song-filters";
import { SongGridSkeleton } from "./_components/song-grid-skeleton";
import { SongEmptyState } from "./_components/song-empty-state";
import { useSongMutations } from "@/hooks/use-song-mutations";
import { useEntityDialog } from "@/hooks/use-entity-dialog";
import { useDebounce } from "@/hooks/use-debounce";
import { usePermissions } from "@/hooks/use-permissions";
import type { Song } from "@/types";
import type { SongFormData } from "@/validators/song";

const PAGE_SIZE = 24;

export default function SongsPage() {
  const canEdit = usePermissions().can("songs.edit");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState("");
  const [lyricsDialogOpen, setLyricsDialogOpen] = useState(false);
  const [youtubeDialogOpen, setYoutubeDialogOpen] = useState(false);
  const [spotifyDialogOpen, setSpotifyDialogOpen] = useState(false);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [duplicatesOpen, setDuplicatesOpen] = useState(false);
  const { data: duplicateGroups } = api.song.duplicateGroups.useQuery(undefined, { staleTime: 60_000 });
  const [historySong, setHistorySong] = useState<Song | null>(null);

  const songDialog = useEntityDialog<Song>({ fromUrl: true });
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading, isFetching } = api.song.list.useQuery({
    search: debouncedSearch,
    category: category === "" ? undefined : category,
    page,
    limit: PAGE_SIZE,
  }, { placeholderData: (previous) => previous });

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

  const handlePlayYouTube = (song: Song) => {
    setSelectedSong(song);
    setYoutubeDialogOpen(true);
  };

  const handlePlaySpotify = (song: Song) => {
    setSelectedSong(song);
    setSpotifyDialogOpen(true);
  };

  const handleViewHistory = (song: Song) => {
    setHistorySong(song);
    setHistoryDialogOpen(true);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    setPage(1);
  };

  const songs: Song[] = (data?.songs ?? []).map((song) => ({
    ...song,
    artist: song.artist ?? "",
    lyrics: song.lyrics ?? undefined,
    chords: song.chords ?? undefined,
    duration: song.duration ?? undefined,
    youtubeUrl: song.youtubeUrl ?? undefined,
    youtubeVideoId: song.youtubeVideoId ?? undefined,
    spotifyUrl: song.spotifyUrl ?? undefined,
    spotifyTrackId: song.spotifyTrackId ?? undefined,
  }));

  return (
    <PageContainer>
      {selectedSong && (
        <>
          <LyricsDialog song={selectedSong} open={lyricsDialogOpen} onOpenChange={setLyricsDialogOpen} />
          <YouTubePlayer
            key={selectedSong.id}
            song={selectedSong}
            open={youtubeDialogOpen}
            onOpenChange={setYoutubeDialogOpen}
          />
          <SpotifyPlayer
            key={`spotify-${selectedSong.id}`}
            song={selectedSong}
            open={spotifyDialogOpen}
            onOpenChange={setSpotifyDialogOpen}
          />
        </>
      )}

      <DuplicateSongsDialog open={duplicatesOpen} onOpenChange={setDuplicatesOpen} />

      {historySong && (
        <LastExecutionsDialog song={historySong} open={historyDialogOpen} onOpenChange={setHistoryDialogOpen} />
      )}

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
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            {canEdit && duplicateGroups && duplicateGroups.length > 0 && (
              <Button variant="outline" onClick={() => setDuplicatesOpen(true)} className="w-full sm:w-auto">
                <Merge />
                Duplicadas ({duplicateGroups.length})
              </Button>
            )}
            {canEdit && (
              <Button onClick={songDialog.openCreate} className="w-full sm:w-auto">
                <Plus />
                Nova música
              </Button>
            )}
          </div>
        }
      />

      <YouTubeStatus />
      <SpotifyStatus />

      <Card>
        <CardHeader className="p-4 pb-3 sm:p-6 sm:pb-3">
          <SongFilters
            search={search}
            onSearchChange={handleSearchChange}
            category={category}
            onCategoryChange={handleCategoryChange}
            isSearching={isFetching && search !== ""}
          />
        </CardHeader>

        <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
          {isLoading ? (
            <SongGridSkeleton />
          ) : songs.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {songs.map((song) => (
                  <SongCard
                    key={song.id}
                    song={song}
                    onEdit={songDialog.openEdit}
                    onDelete={(target) => void handleDelete(target)}
                    onViewLyrics={handleViewLyrics}
                    onPlayYouTube={handlePlayYouTube}
                    onPlaySpotify={handlePlaySpotify}
                    onViewHistory={handleViewHistory}
                  />
                ))}
              </div>

              <PaginationBar
                page={page}
                totalPages={data?.totalPages ?? 1}
                total={data?.total ?? 0}
                showing={songs.length}
                onPageChange={setPage}
                itemLabel="músicas"
              />
            </>
          ) : (
            <SongEmptyState
              onCreateClick={canEdit ? songDialog.openCreate : undefined}
              filtered={debouncedSearch !== "" || category !== ""}
            />
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
