"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/trpc/react";
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { AddSongToEvent } from "./add-song-to-event";

interface EventSongsManagerProps {
  eventId: number;
  songs: any[];
  onUpdate: () => void;
}

export function EventSongsManager({ eventId, songs, onUpdate }: EventSongsManagerProps) {
  const [showAddSong, setShowAddSong] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  
  const removeSong = api.event.removeSong.useMutation({
    onSuccess: () => {
      toast.success("Música removida do evento!");
      onUpdate();
    },
    onError: (error) => {
      toast.error("Erro ao remover música: " + error.message);
    },
  });

  const updateSongOrder = api.event.updateSongOrder.useMutation({
    onSuccess: () => {
      toast.success("Ordem atualizada!");
      onUpdate();
      setIsReordering(false);
    },
    onError: (error) => {
      toast.error("Erro ao reordenar: " + error.message);
      setIsReordering(false);
    },
  });

  const handleReorder = async (songId: number, direction: 'up' | 'down') => {
    setIsReordering(true);
    
    try {
      // Encontrar a música atual e sua posição
      const currentIndex = songs.findIndex(item => item.eventSong.id === songId);
      if (currentIndex === -1) return;

      // Determinar a nova posição
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      
      // Verificar se a nova posição é válida
      if (newIndex < 0 || newIndex >= songs.length) {
        setIsReordering(false);
        return;
      }

      // Trocar as ordens das músicas
      const updatedSongs = [...songs];
      const currentSong = updatedSongs[currentIndex];
      const targetSong = updatedSongs[newIndex];
      
      // Trocar as ordens
      [currentSong.eventSong.order, targetSong.eventSong.order] = 
      [targetSong.eventSong.order, currentSong.eventSong.order];
      
      // Atualizar no banco de dados
      await updateSongOrder.mutateAsync({
        eventSongId: currentSong.eventSong.id,
        newOrder: currentSong.eventSong.order
      });
      
      await updateSongOrder.mutateAsync({
        eventSongId: targetSong.eventSong.id,
        newOrder: targetSong.eventSong.order
      });
      
    } catch (error) {
      console.error("Erro ao reordenar:", error);
      setIsReordering(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Repertório do Evento</CardTitle>
        <Button onClick={() => setShowAddSong(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Música
        </Button>
      </CardHeader>
      <CardContent>
        {showAddSong && (
          <AddSongToEvent
            eventId={eventId}
            onClose={() => setShowAddSong(false)}
            onAdd={onUpdate}
          />
        )}

        {songs.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Nenhuma música adicionada ao evento.
          </p>
        ) : (
          <div className="space-y-2">
            {songs
              .sort((a, b) => a.eventSong.order - b.eventSong.order)
              .map((item, index) => (
                <div
                  key={item.eventSong.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-8 text-center font-mono text-sm text-muted-foreground">
                      {item.eventSong.order}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{item.song?.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {item.song?.artist} • {item.leader?.firstName} {item.leader?.lastName}
                      </p>
                      {item.eventSong.notes && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {item.eventSong.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={index === 0 || isReordering}
                      onClick={() => handleReorder(item.eventSong.id, 'up')}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={index === songs.length - 1 || isReordering}
                      onClick={() => handleReorder(item.eventSong.id, 'down')}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => removeSong.mutate(item.eventSong.id)}
                      disabled={removeSong.isPending || isReordering}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}