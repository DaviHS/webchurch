"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { api } from "@/trpc/react";
import { Music, Plus } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page-header";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SongForm } from "./_components/form";
import { isSongCategory } from "@/validators/song";
import { LyricsDialog } from "./_components/lyrics-dialog";
import { YouTubePlayer } from "./_components/youtube-player";
import { YouTubeStatus } from "./_components/youtube-status";
import { LastExecutionsDialog } from "./_components/last-executions-dialog";
import { SongCard } from "./_components/song-card";
import { SongFilters } from "./_components/song-filters";
import { SongGridSkeleton } from "./_components/song-grid-skeleton";
import { SongPagination } from "./_components/song-pagination";
import { SongEmptyState } from "./_components/song-empty-state";
import { useSongMutations } from "@/hooks/use-song-mutations";
import { useCreateRequest } from "@/hooks/use-create-request";
import { useDebounce } from "@/hooks/use-debounce";
import type { Song } from "@/types";
import type { SongFormData } from "@/validators/song";

const PAGE_SIZE = 24;

export default function SongsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [lyricsDialogOpen, setLyricsDialogOpen] = useState(false);
  const [youtubeDialogOpen, setYoutubeDialogOpen] = useState(false);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [historySong, setHistorySong] = useState<Song | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const createRequest = useCreateRequest();
  const dialogOpen = isDialogOpen || createRequest.requested;
  const setDialogOpen = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) createRequest.dismiss();
  };

  const { data, isLoading } = api.song.list.useQuery({
    search: debouncedSearch,
    category: category === "" ? undefined : category,
    page,
    limit: PAGE_SIZE,
  });

  const { handleSubmit, handleDelete, isPending } = useSongMutations({
    onSuccess: () => {
      setDialogOpen(false);
      setEditingSong(null);
    },
  });

  const handleEdit = (song: Song) => {
    setEditingSong(song);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingSong(null);
    setIsDialogOpen(true);
  };

  const handleFormSubmit = (data: SongFormData) => {
    handleSubmit(data, editingSong);
  };

  const initialFormData = editingSong
    ? {
        ...editingSong,
        category: isSongCategory(editingSong.category)
          ? editingSong.category
          : undefined,
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

  const handleViewHistory = (song: Song) => {
    setHistorySong(song);
    setHistoryDialogOpen(true);
  };

  const songs: Song[] = (data?.songs ?? []).map((song) => ({
    ...song,
    artist: song.artist ?? "",
    lyrics: song.lyrics ?? undefined,
    chords: song.chords ?? undefined,
    duration: song.duration ?? undefined,
    youtubeUrl: song.youtubeUrl ?? undefined,
    youtubeVideoId: song.youtubeVideoId ?? undefined,
  }));

  return (
    <PageContainer>
      {selectedSong && (
        <>
          <LyricsDialog
            song={selectedSong}
            open={lyricsDialogOpen}
            onOpenChange={setLyricsDialogOpen}
          />
          <YouTubePlayer
            key={selectedSong.id}
            song={selectedSong}
            open={youtubeDialogOpen}
            onOpenChange={setYoutubeDialogOpen}
          />
        </>
      )}

      {historySong && (
        <LastExecutionsDialog
          song={historySong}
          open={historyDialogOpen}
          onOpenChange={setHistoryDialogOpen}
        />
      )}

      <PageHeader
        title="Músicas"
        icon={Music}
        description="Repertório do ministério de louvor."
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleCreate} className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Nova música
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] w-[95vw] max-w-2xl overflow-y-auto sm:w-full">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl">
                  {editingSong ? "Editar música" : "Nova música"}
                </DialogTitle>
              </DialogHeader>
              <SongForm
                onSubmit={handleFormSubmit}
                initialData={initialFormData}
                isLoading={isPending}
                onCancel={() => setDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        }
      />

      <YouTubeStatus />

      <Card>
        <CardHeader className="pb-3">
          <SongFilters
            search={search}
            onSearchChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            category={category}
            onCategoryChange={(value) => {
              setCategory(value);
              setPage(1);
            }}
          />
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <SongGridSkeleton />
          ) : songs.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {songs.map((song) => (
                  <SongCard
                    key={song.id}
                    song={song}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onViewLyrics={handleViewLyrics}
                    onPlayYouTube={handlePlayYouTube}
                    onViewHistory={handleViewHistory}
                  />
                ))}
              </div>

              <SongPagination
                page={page}
                totalPages={data?.totalPages ?? 1}
                total={data?.total ?? 0}
                showing={songs.length}
                onPageChange={setPage}
              />
            </>
          ) : (
            <SongEmptyState
              onCreateClick={handleCreate}
              filtered={debouncedSearch !== "" || category !== ""}
            />
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
