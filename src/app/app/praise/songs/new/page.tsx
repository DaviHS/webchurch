"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/trpc/react";
import { SongForm } from "../_components/form";
import { toast } from "sonner";

export default function NewSongPage() {
  const router = useRouter();
  const createSong = api.song.create.useMutation({
    onSuccess: () => {
      toast.success("Música criada com sucesso!");
      router.push("/praise/songs");
    },
    onError: (error) => {
      toast.error("Erro ao criar música: " + error.message);
    },
  });

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Nova Música</CardTitle>
        </CardHeader>
        <CardContent>
          <SongForm
            onSubmit={(data) => createSong.mutate(data)}
            isLoading={createSong.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}