"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  isSongCategory,
  songCategories,
  songSchema,
  songFormSchema,
  type SongFormData,
  type SongFormInput,
  type SongFormOutput,
} from "@/validators/song";
import { songCategoryLabel } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResponsiveDialogBody, ResponsiveDialogFooter } from "@/components/ui/responsive-dialog";
import { CheckCircle, Info } from "lucide-react";

interface SongFormProps {
  onSubmit: (data: SongFormData) => void;
  initialData?: Partial<SongFormData> & { youtubeVideoId?: string; spotifyTrackId?: string };
  isLoading?: boolean;
  onCancel?: () => void;
}

const secondsToDurationString = (seconds: number | undefined): string => {
  if (!seconds) return "";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
};

export function SongForm({ onSubmit, initialData, isLoading = false, onCancel }: SongFormProps) {
  const form = useForm<SongFormInput, unknown, SongFormOutput>({
    resolver: zodResolver(songFormSchema),
    defaultValues: {
      title: initialData?.title ?? "",
      artist: initialData?.artist ?? "",
      category: initialData?.category ?? "praise",
      lyrics: initialData?.lyrics ?? "",
      youtubeUrl: initialData?.youtubeUrl ?? "",
      spotifyUrl: initialData?.spotifyUrl ?? "",
      duration: initialData?.duration ? secondsToDurationString(initialData.duration) : "",
    },
  });

  const handleSubmit = form.handleSubmit((formData) => {
    onSubmit(songSchema.parse(formData));
  });

  const isEditing = Boolean(initialData);
  const isLinkedToPlaylist = Boolean(initialData?.youtubeVideoId);
  const { errors } = form.formState;

  return (
    <form onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
      <ResponsiveDialogBody className="space-y-4 pb-4">
        {isLinkedToPlaylist ? (
          <div className="rounded-md border border-success/30 bg-success/10 p-3">
            <p className="flex items-start gap-2 text-sm text-success">
              <CheckCircle className="mt-0.5 size-4 shrink-0" />
              <span>Esta música está vinculada à playlist do YouTube</span>
            </p>
          </div>
        ) : (
          <div className="rounded-md border border-info/30 bg-info/10 p-3">
            <p className="flex items-start gap-2 text-sm text-info">
              <Info className="mt-0.5 size-4 shrink-0" />
              <span>Esta música será adicionada automaticamente à playlist do YouTube da igreja.</span>
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              {...form.register("title")}
              placeholder="Digite o título da música"
              autoComplete="off"
              enterKeyHint="next"
              aria-invalid={Boolean(errors.title)}
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="artist">Artista</Label>
            <Input
              id="artist"
              {...form.register("artist")}
              placeholder="Nome do artista ou banda"
              autoComplete="off"
              enterKeyHint="next"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Controller
              control={form.control}
              name="category"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    if (isSongCategory(value)) field.onChange(value);
                  }}
                >
                  <SelectTrigger id="category" className="w-full">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {songCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {songCategoryLabel(category)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duração (mm:ss)</Label>
            <Input
              id="duration"
              placeholder="03:30"
              {...form.register("duration")}
              autoComplete="off"
              enterKeyHint="next"
              aria-invalid={Boolean(errors.duration)}
            />
            {errors.duration && <p className="text-xs text-destructive">{errors.duration.message}</p>}
            <p className="text-xs text-muted-foreground">Ex.: 03:30. Em branco, usa a duração do vídeo do YouTube.</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="youtubeUrl">URL do YouTube</Label>
          <Input
            id="youtubeUrl"
            {...form.register("youtubeUrl")}
            placeholder="https://www.youtube.com/watch?v=..."
            inputMode="url"
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="next"
            aria-invalid={Boolean(errors.youtubeUrl)}
          />
          {errors.youtubeUrl && <p className="text-xs text-destructive">{errors.youtubeUrl.message}</p>}
          <p className="text-xs text-muted-foreground">
            {initialData?.youtubeUrl
              ? "Atualize a URL para modificar o vídeo vinculado"
              : "Deixe em branco para buscar automaticamente pelo título e artista"}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="spotifyUrl">URL do Spotify</Label>
          <Input
            id="spotifyUrl"
            {...form.register("spotifyUrl")}
            placeholder="https://open.spotify.com/track/..."
            inputMode="url"
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="next"
          />
          <p className="text-xs text-muted-foreground">
            {initialData?.spotifyTrackId
              ? "Vinculada à playlist do Spotify. Atualize a URL para trocar a faixa."
              : "Deixe em branco para buscar automaticamente pelo título e artista, e adicionar à playlist do Spotify da igreja."}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="lyrics">Letra</Label>
          <Textarea
            id="lyrics"
            {...form.register("lyrics")}
            rows={10}
            placeholder="Digite a letra da música..."
            className="min-h-48 resize-y"
          />
          <p className="text-xs text-muted-foreground">Utilize quebras de linha para separar os versos</p>
        </div>
      </ResponsiveDialogBody>

      <ResponsiveDialogFooter>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Salvando..." : isEditing ? "Salvar" : "Criar música"}
        </Button>
      </ResponsiveDialogFooter>
    </form>
  );
}
