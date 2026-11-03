"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  songCategories,
  songSchema,
  songFormSchema,
  type SongFormData,
  type SongFormInput,
  type SongFormOutput,
} from "@/validators/song";
import { getCategoryName } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Info } from "lucide-react";
import { isSongCategory } from "@/validators/song";

interface SongFormProps {
  onSubmit: (data: SongFormData) => void;
  initialData?: Partial<SongFormData> & { youtubeVideoId?: string };
  isLoading?: boolean;
  onCancel?: () => void;
}

const secondsToDurationString = (seconds: number | undefined): string => {
  if (!seconds) return '';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
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
      duration: initialData?.duration ? secondsToDurationString(initialData.duration) : "",
    },
  });

  const handleSubmit = form.handleSubmit((formData) => {
    onSubmit(songSchema.parse(formData));
  });

  const isLinkedToPlaylist = Boolean(initialData?.youtubeVideoId);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!isLinkedToPlaylist && (
        <div className="rounded-md border border-info/30 bg-info/10 p-3">
          <p className="flex items-center gap-2 text-sm text-info">
            <Info className="h-4 w-4 shrink-0" />
            <span>Esta música será adicionada automaticamente à playlist do YouTube da igreja.</span>
          </p>
        </div>
      )}

      {isLinkedToPlaylist && (
        <div className="rounded-md border border-success/30 bg-success/10 p-3">
          <p className="flex items-center gap-2 text-sm text-success">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>Esta música está vinculada à playlist do YouTube</span>
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title" className="text-sm font-medium">
            Título *
          </Label>
          <Input 
            id="title" 
            {...form.register("title")} 
            placeholder="Digite o título da música"
            className="w-full text-sm"
          />
          {form.formState.errors.title && (
            <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="artist" className="text-sm font-medium">
            Artista
          </Label>
          <Input 
            id="artist" 
            {...form.register("artist")} 
            placeholder="Nome do artista ou banda"
            className="w-full text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category" className="text-sm font-medium">
            Categoria
          </Label>
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
                <SelectTrigger id="category" className="w-full text-sm">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {songCategories.map((category) => (
                    <SelectItem key={category} value={category} className="text-sm">
                      {getCategoryName(category)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration" className="text-sm font-medium">
            Duração (mm:ss)
          </Label>
          <Input 
            id="duration" 
            placeholder="03:30" 
            {...form.register("duration")} 
            className="w-full text-sm"
          />
          {form.formState.errors.duration && (
            <p className="text-xs text-destructive">{form.formState.errors.duration.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Ex.: 03:30. Em branco, usa a duração do vídeo do YouTube.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="youtubeUrl" className="text-sm font-medium">
          URL do YouTube
        </Label>
        <Input 
          id="youtubeUrl" 
          {...form.register("youtubeUrl")} 
          placeholder="https://www.youtube.com/watch?v=..."
          className="w-full text-sm"
        />
        {form.formState.errors.youtubeUrl && (
          <p className="text-xs text-destructive">{form.formState.errors.youtubeUrl.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          {!initialData?.youtubeUrl 
            ? "Deixe em branco para buscar automaticamente pelo título e artista"
            : "Atualize a URL para modificar o vídeo vinculado"
          }
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="lyrics" className="text-sm font-medium">
          Letra
        </Label>
        <Textarea 
          id="lyrics" 
          {...form.register("lyrics")} 
          rows={10}
          placeholder="Digite a letra da música..."
          className="resize-none w-full text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Utilize quebras de linha para separar os versos
        </p>
      </div>

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Salvando..." : initialData ? "Salvar alterações" : "Criar música"}
        </Button>
      </div>
    </form>
  );
}