"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/trpc/react";
import { Plus, Search, Play, Edit, Trash2, Eye, Youtube, MoreVertical } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SongForm } from "./_components/form";
import { toast } from "sonner";
import { SongPresentation } from "./_components/song-presentation";
import { LyricsDialog } from "./_components/lyrics-dialog";
import { YouTubePlayer } from "./_components/youtube-player";
import type { SongFormData } from "@/validators/song";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function SongsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState("");
  const [presentingSong, setPresentingSong] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSong, setEditingSong] = useState<any>(null);
  const [lyricsDialogOpen, setLyricsDialogOpen] = useState(false);
  const [youtubeDialogOpen, setYoutubeDialogOpen] = useState(false);
  const [selectedSong, setSelectedSong] = useState<any>(null);

  const { data, isLoading, refetch } = api.song.list.useQuery({
    search,
    category: category || undefined,
    page,
    limit: 24,
  });

  const createSong = api.song.create.useMutation({
    onSuccess: () => {
      toast.success("Música criada com sucesso!");
      setIsDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao criar música: " + error.message);
    },
  });

  const updateSong = api.song.update.useMutation({
    onSuccess: () => {
      toast.success("Música atualizada com sucesso!");
      setIsDialogOpen(false);
      setEditingSong(null);
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar música: " + error.message);
    },
  });

  const deleteSong = api.song.delete.useMutation({
    onSuccess: () => {
      toast.success("Música excluída com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao excluir música: " + error.message);
    },
  });

  const getCategoryName = (category: string) => {
    const categories: { [key: string]: string } = {
      hymn: "Hino",
      praise: "Louvor",
      worship: "Adoração",
      chorus: "Coro",
      special: "Especial"
    };
    return categories[category] || category;
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return "-";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleEdit = (song: any) => {
    setEditingSong(song);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingSong(null);
    setIsDialogOpen(true);
  };

  const handleSubmit = (data: SongFormData) => {
    if (editingSong) {
      updateSong.mutate({ id: editingSong.id, data });
    } else {
      createSong.mutate(data);
    }
  };

  const handleDelete = (song: any) => {
    if (confirm(`Tem certeza que deseja excluir a música "${song.title}"?`)) {
      deleteSong.mutate(song.id);
    }
  };

  const handleViewLyrics = (song: any) => {
    setSelectedSong(song);
    setLyricsDialogOpen(true);
  };

  const handlePlayYouTube = (song: any) => {
    setSelectedSong(song);
    setYoutubeDialogOpen(true);
  };

  const SongCard = ({ song }: { song: any }) => (
    <Card className="h-full flex flex-col transition-all hover:shadow-md">
      <CardContent className="p-3 flex items-center justify-between gap-2">
        {/* Esquerda: título + artista + categoria */}
        <div className="flex flex-col min-w-0">
          <CardTitle className="text-sm leading-tight line-clamp-1">
            {song.title}
          </CardTitle>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="line-clamp-1">
              {song.artist || "Artista não informado"}
            </span>
            <Badge variant="outline" className="text-xs">
              {getCategoryName(song.category)}
            </Badge>
          </div>
        </div>

        {/* Direita: ações */}
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              <DropdownMenuItem onClick={() => handleEdit(song)}>
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDelete(song)}
                className="text-red-600"
              >
                Excluir
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleViewLyrics(song)}>
                Ver Letra
              </DropdownMenuItem>
              {song.youtubeUrl && (
                <DropdownMenuItem onClick={() => handlePlayYouTube(song)}>
                  YouTube
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="default"
            size="sm"
            onClick={() => setPresentingSong(song)}
            disabled={!song.lyrics}
            title="Apresentar música"
            className="h-6 w-6 p-0"
          >
            <Play className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto py-4 px-2 sm:px-4">
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
            song={selectedSong}
            open={youtubeDialogOpen}
            onOpenChange={setYoutubeDialogOpen}
          />
        </>
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
              onSubmit={handleSubmit}
              initialData={editingSong}
              isLoading={createSong.isPending || updateSong.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="relative w-full">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por música ou artista..."
                className="pl-10 w-full text-sm sm:text-base"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <Select
              value={category || "any"}
              onValueChange={(val) => setCategory(val === "any" ? "" : val)}
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Todas categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Todas categorias</SelectItem>
                <SelectItem value="hymn">Hino</SelectItem>
                <SelectItem value="praise">Louvor</SelectItem>
                <SelectItem value="worship">Adoração</SelectItem>
                <SelectItem value="chorus">Coro</SelectItem>
                <SelectItem value="special">Especial</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
              {[...Array(12)].map((_, i) => (
                <Card key={i} className="h-full animate-pulse">
                  <CardHeader className="space-y-2 pb-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent className="space-y-2 pb-2">
                    <div className="h-4 bg-muted rounded w-full"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
                {data?.songs.map((song) => (
                  <SongCard key={song.id} song={song} />
                ))}
              </div>
              
              {(!data?.songs || data.songs.length === 0) && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Nenhuma música encontrada</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={handleCreate}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Criar primeira música
                  </Button>
                </div>
              )}
              
              {data && data.totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {data.songs.length} de {data.total} músicas
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      Anterior
                    </Button>
                    <span className="flex items-center px-4 text-sm">
                      Página {page} de {data.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === data.totalPages}
                    >
                      Próximo
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}