"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { songSchema, songFormSchema, type SongFormData, type SongFormInput } from "@/validators/song";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle } from "lucide-react";

interface SongFormProps {
  onSubmit: (data: SongFormData) => void;
  initialData?: Partial<SongFormData> & { youtubeVideoId?: string };
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

  // Verifica se a música está vinculada à playlist do YouTube
  const isLinkedToPlaylist = initialData?.youtubeVideoId;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Aviso sobre vinculação automática com a playlist */}
      {!initialData?.youtubeVideoId && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-blue-800 text-sm">
            <strong>📝 Informação:</strong> Esta música será automaticamente adicionada à playlist do YouTube da igreja.
          </p>
        </div>
      )}

      {/* Status de vinculação para edição */}
      {isLinkedToPlaylist && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3">
          <p className="text-green-800 text-sm flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
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
            <p className="text-red-500 text-xs mt-1">{form.formState.errors.title.message}</p>
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
          <Select
            value={form.watch("category")}
            onValueChange={(value) => form.setValue("category", value as any)}
          >
            <SelectTrigger className="w-full text-sm">
              <SelectValue placeholder="Selecione a categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hymn" className="text-sm">Hino</SelectItem>
              <SelectItem value="praise" className="text-sm">Louvor</SelectItem>
              <SelectItem value="worship" className="text-sm">Adoração</SelectItem>
              <SelectItem value="chorus" className="text-sm">Coro</SelectItem>
              <SelectItem value="special" className="text-sm">Especial</SelectItem>
            </SelectContent>
          </Select>
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
            <p className="text-red-500 text-xs mt-1">{form.formState.errors.duration.message}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Exemplo: 03:30 para 3 minutos e 30 segundos
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
          <p className="text-red-500 text-xs mt-1">{form.formState.errors.youtubeUrl.message}</p>
        )}
        <p className="text-xs text-gray-500 mt-1">
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
        <p className="text-xs text-gray-500 mt-1">
          Utilize quebras de linha para separar os versos
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 pt-4">
        <Button 
          type="submit" 
          disabled={isLoading} 
          className="flex-1 text-sm sm:text-base"
        >
          {isLoading ? "Salvando..." : "Salvar Música"}
        </Button>
      </div>
    </form>
  );
}