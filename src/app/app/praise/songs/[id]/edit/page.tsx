"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/trpc/react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { SongForm } from "../../_components/form";
import { use } from "react";

export default function EditSongPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Use o hook use para resolver a Promise
  const resolvedParams = use(params);
  const songId = Number(resolvedParams.id);

  const router = useRouter();
  const { data: song, isLoading } = api.song.getById.useQuery(songId);
  const updateSong = api.song.update.useMutation({
    onSuccess: () => {
      toast.success("Música atualizada com sucesso!");
      router.push("/praise/songs");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar música: " + error.message);
    },
  });

  if (isLoading) return <div>Carregando...</div>;
  if (!song) return <div>Música não encontrada</div>;

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold">Editar Música</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Editar {song.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <SongForm
            onSubmit={(data) => updateSong.mutate({ id: songId, data })}
            initialData={{
              ...song,
              duration: song.duration ?? undefined,
              bpm: song.bpm ?? undefined,
              lyrics: song.lyrics ?? undefined,
              chords: song.chords ?? undefined,
              youtubeUrl: song.youtubeUrl ?? undefined,
              artist: song.artist ?? undefined,
              key: song.key ?? undefined,
            }}
            isLoading={updateSong.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}