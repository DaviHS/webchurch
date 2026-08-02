"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { api } from "@/trpc/react";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SongForm } from "./_components/form";
import { SongPresentation } from "./_components/song-presentation";
import { LyricsDialog } from "./_components/lyrics-dialog";
import { YouTubePlayer } from "./_components/youtube-player";
import { LastExecutionsDialog } from "./_components/last-executions-dialog";
import { SongCard } from "./_components/song-card";
import { SongFilters } from "./_components/song-filters";
import { SongGridSkeleton } from "./_components/song-grid-skeleton";
import { SongPagination } from "./_components/song-pagination";
import { SongEmptyState } from "./_components/song-empty-state";
import { useSongMutations } from "@/hooks/use-song-mutations";
import { useDebounce } from "@/hooks/use-debounce";
import type { Song } from "@/types";
import type { SongFormData } from "@/validators/song";

export default function SongsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState("");
  const [presentingSong, setPresentingSong] = useState<Song | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [lyricsDialogOpen, setLyricsDialogOpen] = useState(false);
  const [youtubeDialogOpen, setYoutubeDialogOpen] = useState(false);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [historySong, setHistorySong] = useState<Song | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading, refetch } = api.song.list.useQuery({
    search: debouncedSearch,
    category: category || undefined,
    page,
    limit: 24,
  });

  const { handleSubmit, handleDelete, isPending } = useSongMutations(refetch, {
    onSuccess: () => {
      setIsDialogOpen(false);
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
    ? ({
        ...editingSong,
        category: editingSong.category as SongFormData["category"],
      } as Partial<SongFormData>)
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

  const handlePresent = (song: Song) => {
    setPresentingSong(song);
  };

  const songs: Song[] = (data?.songs || []).map((song) => ({
    ...song,
    artist: song.artist ?? "",
    lyrics: song.lyrics ?? undefined,
    chords: song.chords ?? undefined,
    duration: song.duration ?? undefined,
    youtubeUrl: song.youtubeUrl ?? undefined,
    youtubeVideoId: song.youtubeVideoId ?? undefined,
  }));

  return (
    <div className="container mx-auto py-4">
      {presentingSong && (
        <SongPresentation
          song={presentingSong}
          onClose={() => setPresentingSong(null)}
        />
      )}

      {selectedSong && (
        <>
          <LyricsDialog
            song={selectedSong}
            open={lyricsDialogOpen}
            onOpenChange={setLyricsDialogOpen}
          />
          <YouTubePlayer
            song={{
              ...selectedSong,
              artist: selectedSong.artist || undefined,
            }}
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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Músicas</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreate} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Nova Música
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">
                {editingSong ? "Editar Música" : "Nova Música"}
              </DialogTitle>
            </DialogHeader>
            <SongForm
              onSubmit={handleFormSubmit}
              initialData={initialFormData}
              isLoading={isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
                {songs.map((song) => (
                  <SongCard
                    key={song.id}
                    song={song}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onViewLyrics={handleViewLyrics}
                    onPlayYouTube={handlePlayYouTube}
                    onViewHistory={handleViewHistory}
                    onPresent={handlePresent}
                  />
                ))}
              </div>

              <SongPagination
                page={page}
                totalPages={data?.totalPages || 1}
                total={data?.total || 0}
                showing={songs.length}
                onPageChange={setPage}
              />
            </>
          ) : (
            <SongEmptyState onCreateClick={handleCreate} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}