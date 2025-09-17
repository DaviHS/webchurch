"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/trpc/react";
import { X, Search } from "lucide-react";
import { toast } from "sonner";

interface AddSongToEventProps {
  eventId: number;
  onClose: () => void;
  onAdd: () => void;
}

export function AddSongToEvent({ eventId, onClose, onAdd }: AddSongToEventProps) {
  const [search, setSearch] = useState("");
  const [selectedSong, setSelectedSong] = useState<any>(null);
  const [order, setOrder] = useState(1);
  const [notes, setNotes] = useState("");

  const { data: songs, isLoading } = api.song.list.useQuery({
    search,
    limit: 10,
  });

  const addSong = api.event.addSong.useMutation({
    onSuccess: () => {
      toast.success("Música adicionada ao evento!");
      onAdd();
      onClose();
    },
    onError: (error) => {
      toast.error("Erro ao adicionar música: " + error.message);
    },
  });

  const handleAddSong = () => {
    if (!selectedSong) return;

    addSong.mutate({
      eventId,
      songId: selectedSong.id,
      order,
      notes: notes || undefined,
    });
  };

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Adicionar Música</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar músicas..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {songs?.songs && songs.songs.length > 0 && (
          <Select onValueChange={(value) => setSelectedSong(songs.songs.find(s => s.id === Number(value)))}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma música" />
            </SelectTrigger>
            <SelectContent>
              {songs.songs.map((song) => (
                <SelectItem key={song.id} value={song.id.toString()}>
                  {song.title} - {song.artist}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {selectedSong && (
          <>
            <Input
              type="number"
              placeholder="Ordem"
              value={order}
              onChange={(e) => setOrder(Number(e.target.value))}
              min={1}
            />
            <Input
              placeholder="Observações (opcional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <Button onClick={handleAddSong} disabled={addSong.isPending}>
              {addSong.isPending ? "Adicionando..." : "Adicionar Música"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}