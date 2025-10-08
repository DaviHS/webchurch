"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ArrowUp, ArrowDown, Plus, Trash2, Music, User, ChevronDown, Search, X } from "lucide-react";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { getCategoryName } from "@/lib/utils/format-translate";

interface EventSongsManagerProps {
  eventId: number;
  songs: any[];
  onUpdate: () => void;
}

export function EventSongsManager({ eventId, songs, onUpdate }: EventSongsManagerProps) {
  const [newSong, setNewSong] = useState({
    songId: "",
    leaderId: "",
    notes: ""
  });
  const [isAdding, setIsAdding] = useState(false);
  const [songSearch, setSongSearch] = useState("");
  const [showSongSearch, setShowSongSearch] = useState(false);
  const [selectedSong, setSelectedSong] = useState<any>(null);

  // Buscar dados
  const { data: songsData, isLoading: songsLoading } = api.song.list.useQuery({
    search: songSearch || undefined,
    limit: 50, // Aumentei o limite para 50
  });
  const allSongs = songsData?.songs || [];

  const { data: membersData } = api.member.getAll.useQuery({});
  const allMembers = membersData?.map((item: any) => item.members) || [];

  const addSongMutation = api.event.addSong.useMutation();
  const removeSongMutation = api.event.removeSong.useMutation();
  const updateSongOrderMutation = api.event.updateSongOrder.useMutation();

  // Filtrar músicas que já foram adicionadas ao evento
  const availableSongs = allSongs.filter(song => 
    !songs.some(eventSong => eventSong.songId === song.id)
  );

  const handleAddSong = async () => {
    if (!newSong.songId) {
      toast.error("Selecione uma música");
      return;
    }

    try {
      const nextOrder = songs.length > 0 ? Math.max(...songs.map((s: any) => s.order)) + 1 : 1;
      
      await addSongMutation.mutateAsync({
        eventId,
        songId: parseInt(newSong.songId),
        order: nextOrder,
        leaderId: newSong.leaderId ? parseInt(newSong.leaderId) : undefined,
        notes: newSong.notes || undefined
      });

      toast.success("Música adicionada com sucesso!");
      setNewSong({ songId: "", leaderId: "", notes: "" });
      setSelectedSong(null);
      setSongSearch("");
      setShowSongSearch(false);
      onUpdate();
    } catch (error) {
      toast.error("Erro ao adicionar música");
    }
  };

  const handleRemoveSong = async (songId: number) => {
    if (confirm("Tem certeza que deseja remover esta música?")) {
      try {
        await removeSongMutation.mutateAsync(songId);
        toast.success("Música removida com sucesso!");
        onUpdate();
      } catch (error) {
        toast.error("Erro ao remover música");
      }
    }
  };

  const handleMoveSong = async (songId: number, direction: 'up' | 'down') => {
    const songIndex = songs.findIndex((s: any) => s.id === songId);
    if (songIndex === -1) return;

    const newIndex = direction === 'up' ? songIndex - 1 : songIndex + 1;
    if (newIndex < 0 || newIndex >= songs.length) return;

    try {
      // Atualizar a ordem da música movida
      await updateSongOrderMutation.mutateAsync({
        eventSongId: songId,
        newOrder: newIndex + 1
      });

      // Atualizar a ordem da música que foi substituída
      await updateSongOrderMutation.mutateAsync({
        eventSongId: songs[newIndex].id,
        newOrder: songIndex + 1
      });

      toast.success("Ordem atualizada com sucesso!");
      onUpdate();
    } catch (error) {
      toast.error("Erro ao atualizar ordem");
    }
  };

  const handleSelectSong = (song: any) => {
    setNewSong(prev => ({ ...prev, songId: song.id.toString() }));
    setSelectedSong(song);
    setShowSongSearch(false);
    setSongSearch("");
  };

  const clearSelectedSong = () => {
    setNewSong(prev => ({ ...prev, songId: "" }));
    setSelectedSong(null);
  };

  const sortedSongs = [...songs].sort((a: any, b: any) => a.order - b.order);

  return (
    <div className="space-y-4">
      {/* Collapsible para Adicionar Música */}
      <Collapsible open={isAdding} onOpenChange={setIsAdding} className="border rounded-lg">
        <Card className="border-0 shadow-none">
          <CardContent className="p-0">
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full justify-between p-4 h-auto hover:bg-muted/50"
              >
                <div className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  <span className="font-semibold">Adicionar Música</span>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${isAdding ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <div className="px-4 pb-4 border-t">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end pt-4">
                  <div className="md:col-span-4">
                    <Label htmlFor="song-select" className="text-sm font-medium mb-2 block">
                      Música
                    </Label>
                    
                    {selectedSong ? (
                      <div className="border rounded-lg p-3 bg-muted/30 relative">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium">{selectedSong.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {selectedSong.artist}
                              {selectedSong.category && (
                                <Badge variant="outline" className="ml-2 text-xs">
                                  {getCategoryName(selectedSong.category)}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={clearSelectedSong}
                            className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="relative">
                          <Input
                            placeholder="Buscar música..."
                            value={songSearch}
                            onChange={(e) => setSongSearch(e.target.value)}
                            onFocus={() => setShowSongSearch(true)}
                            className="pr-10"
                          />
                          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>

                        {showSongSearch && (
                          <div className="absolute z-10 w-full max-w-md mt-1 bg-popover border rounded-lg shadow-lg max-h-60 overflow-auto">
                            <div className="p-2">
                              {songsLoading ? (
                                <div className="text-center py-4 text-sm text-muted-foreground">
                                  Carregando...
                                </div>
                              ) : availableSongs.length === 0 ? (
                                <div className="text-center py-4 text-sm text-muted-foreground">
                                  {songSearch ? "Nenhuma música encontrada" : "Nenhuma música disponível"}
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  {availableSongs.map((song: any) => (
                                    <button
                                      key={song.id}
                                      type="button"
                                      onClick={() => handleSelectSong(song)}
                                      className="w-full text-left p-2 rounded hover:bg-accent hover:text-accent-foreground transition-colors"
                                    >
                                      <div className="font-medium">{song.title}</div>
                                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                                        <span>{song.artist}</span>
                                        {song.category && (
                                          <Badge variant="outline" className="text-xs">
                                            {getCategoryName(song.category)}
                                          </Badge>
                                        )}
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-3">
                    <Label htmlFor="leader-select" className="text-sm font-medium">Líder (opcional)</Label>
                    <select
                      value={newSong.leaderId}
                      onChange={(e) => setNewSong(prev => ({ ...prev, leaderId: e.target.value }))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">Sem líder</option>
                      {allMembers.map((member: any) => (
                        <option key={member.id} value={member.id.toString()}>
                          {member.firstName} {member.lastName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-3">
                    <Label htmlFor="song-notes" className="text-sm font-medium">Observações</Label>
                    <Input
                      placeholder="Notas sobre a música..."
                      value={newSong.notes}
                      onChange={(e) => setNewSong(prev => ({ ...prev, notes: e.target.value }))}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Button 
                      onClick={handleAddSong} 
                      disabled={!newSong.songId || addSongMutation.isPending}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar
                    </Button>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </CardContent>
        </Card>
      </Collapsible>

      {/* Lista de Músicas */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Music className="h-5 w-5" />
              Repertório ({songs.length} músicas)
            </h3>
          </div>

          {sortedSongs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Music className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma música adicionada</p>
              <p className="text-sm">Adicione músicas usando o seletor acima</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedSongs.map((song: any, index: number) => (
                <div key={song.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  {/* Controles de Ordem */}
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => handleMoveSong(song.id, 'up')}
                      disabled={index === 0}
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => handleMoveSong(song.id, 'down')}
                      disabled={index === sortedSongs.length - 1}
                    >
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Número da Ordem */}
                  <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-medium">
                    {song.order}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{song.song?.title || "Música não encontrada"}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
                      <span>{song.song?.artist || "Artista desconhecido"}</span>
                      {song.song?.category && (
                        <Badge variant="outline" className="text-xs">
                          {getCategoryName(song.song.category)}
                        </Badge>
                      )}
                      {song.leader && (
                        <>
                          <span>•</span>
                          <User className="h-3 w-3" />
                          <span>Líder: {song.leader.firstName} {song.leader.lastName}</span>
                        </>
                      )}
                    </div>
                    {song.notes && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {song.notes}
                      </div>
                    )}
                  </div>

                  {/* Ações */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveSong(song.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Overlay para fechar a busca quando clicar fora */}
      {showSongSearch && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowSongSearch(false)}
        />
      )}
    </div>
  );
}