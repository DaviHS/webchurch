"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { songSchema, songFormSchema, type SongFormData, type SongFormInput } from "@/validators/song";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SongFormProps {
  onSubmit: (data: SongFormData) => void;
  initialData?: Partial<SongFormData>;
  isLoading?: boolean;
}

// Função para converter segundos em string "mm:ss"
const secondsToDurationString = (seconds: number | undefined): string => {
  if (!seconds || seconds === 0) return '';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export function SongForm({ onSubmit, initialData, isLoading = false }: SongFormProps) {
  const form = useForm<SongFormInput>({
    resolver: zodResolver(songFormSchema),
    defaultValues: {
      title: initialData?.title || "",
      artist: initialData?.artist || "",
      category: initialData?.category || "praise",
      lyrics: initialData?.lyrics || "",
      youtubeUrl: initialData?.youtubeUrl || "",
      duration: initialData?.duration ? secondsToDurationString(initialData.duration) : "",
    },
  });

  const handleSubmit = form.handleSubmit((formData) => {
    // Converter os dados do formulário para o formato esperado pela API
    const apiData = songSchema.parse(formData);
    console.log(apiData)
    onSubmit(apiData);
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Título *</Label>
        <Input 
          id="title" 
          {...form.register("title")} 
          placeholder="Digite o título da música"
        />
        {form.formState.errors.title && (
          <p className="text-red-500 text-sm mt-1">{form.formState.errors.title.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="artist">Artista</Label>
        <Input 
          id="artist" 
          {...form.register("artist")} 
          placeholder="Nome do artista ou banda"
        />
      </div>

      <div>
        <Label htmlFor="category">Categoria</Label>
        <Select
          value={form.watch("category")}
          onValueChange={(value) => form.setValue("category", value as any)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione a categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hymn">Hino</SelectItem>
            <SelectItem value="praise">Louvor</SelectItem>
            <SelectItem value="worship">Adoração</SelectItem>
            <SelectItem value="chorus">Coro</SelectItem>
            <SelectItem value="special">Especial</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="duration">Duração (mm:ss)</Label>
        <Input 
          id="duration" 
          placeholder="03:30" 
          {...form.register("duration")} 
        />
        {form.formState.errors.duration && (
          <p className="text-red-500 text-sm mt-1">{form.formState.errors.duration.message}</p>
        )}
        <p className="text-xs text-gray-500 mt-1">Exemplo: 03:30 para 3 minutos e 30 segundos</p>
      </div>

      <div>
        <Label htmlFor="youtubeUrl">URL do YouTube</Label>
        <Input 
          id="youtubeUrl" 
          {...form.register("youtubeUrl")} 
          placeholder="https://www.youtube.com/watch?v=..."
        />
        {form.formState.errors.youtubeUrl && (
          <p className="text-red-500 text-sm mt-1">{form.formState.errors.youtubeUrl.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="lyrics">Letra</Label>
        <Textarea 
          id="lyrics" 
          {...form.register("lyrics")} 
          rows={10}
          placeholder="Digite a letra da música..."
          className="resize-none"
        />
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? "Salvando..." : "Salvar Música"}
        </Button>
      </div>
    </form>
  );
}