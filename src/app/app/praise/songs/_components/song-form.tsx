"use client";

import { Controller, useForm, useWatch } from "react-hook-form";
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
import { useState } from "react";
import { ClipboardPaste, Loader2, Search } from "lucide-react";
import { api } from "@/trpc/react";
import type { LyricsCandidate } from "@/lib/lyrics-search";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { lyricsToSlides } from "@/components/presentation/deck";
import { cleanPastedLyrics, stripAccents } from "@/lib/lyrics";
import { toastError } from "@/lib/toast";

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
      skipPlaylist: initialData?.skipPlaylist ?? false,
      duration: initialData?.duration ? secondsToDurationString(initialData.duration) : "",
    },
  });

  const handleSubmit = form.handleSubmit((formData) => {
    onSubmit(songSchema.parse(formData));
  });

  const [title = "", artist = "", lyrics = ""] = useWatch({ control: form.control, name: ["title", "artist", "lyrics"] });
  const slideCount = lyricsToSlides(lyrics).length;

  // Cola o que está na área de transferência (a letra copiada do site) já arrumada.
  const pasteLyrics = async () => {
    try {
      const text = cleanPastedLyrics(await navigator.clipboard.readText());
      if (!text) {
        toast.message("A área de transferência está vazia. Copie a letra primeiro.");
        return;
      }
      form.setValue("lyrics", text, { shouldDirty: true });
      toast.success("Letra colada");
    } catch {
      toastError("Não foi possível ler a área de transferência. Cole a letra direto no campo.");
    }
  };

  const [candidates, setCandidates] = useState<LyricsCandidate[] | null>(null);
  const findLyricsMutation = api.song.findLyrics.useMutation({
    onSuccess: setCandidates,
    onError: () => toastError("Não foi possível buscar a letra agora. Tente de novo."),
  });

  const applyCandidate = (candidate: LyricsCandidate) => {
    form.setValue("lyrics", candidate.lyrics, { shouldDirty: true });
    if (!artist.trim() && candidate.artist) form.setValue("artist", candidate.artist, { shouldDirty: true });
    setCandidates(null);
    toast.success("Letra preenchida. Confira antes de salvar.");
  };

  // Se o artista no Spotify é escrito diferente do cadastro, sugere a grafia do Spotify (um toque para usar).
  const spotifyTrack = api.song.spotifyTrack.useQuery(initialData?.spotifyTrackId ?? "", {
    enabled: Boolean(initialData?.spotifyTrackId),
    staleTime: 10 * 60_000,
  });
  const suggestedArtist = spotifyTrack.data?.artists[0];
  const sameArtist = (a: string, b: string) => stripAccents(a).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim() === stripAccents(b).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const showArtistSuggestion = Boolean(suggestedArtist) && !sameArtist(artist, suggestedArtist ?? "");

  const isEditing = Boolean(initialData);
  const isLinkedToPlaylist = Boolean(initialData?.youtubeVideoId);
  const { errors } = form.formState;

  return (
    <form onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
      <ResponsiveDialogBody className="space-y-4 pb-4">
        <Controller
          control={form.control}
          name="skipPlaylist"
          render={({ field }) => (
            <div className="flex items-start justify-between gap-3 rounded-md border p-3">
              <div className="min-w-0 space-y-0.5">
                <Label htmlFor="include-in-playlist" className="text-sm font-medium">
                  Incluir nas playlists
                </Label>
                <p className="text-xs text-muted-foreground">
                  {field.value
                    ? "Só guarda o link de referência. Esta música não entra nas playlists do YouTube e do Spotify."
                    : isLinkedToPlaylist
                      ? "Esta música está vinculada à playlist do YouTube da igreja."
                      : "Esta música será adicionada às playlists do YouTube e do Spotify da igreja."}
                </p>
              </div>
              <Switch
                id="include-in-playlist"
                checked={!field.value}
                onCheckedChange={(include) => field.onChange(!include)}
                className="mt-0.5 shrink-0"
              />
            </div>
          )}
        />
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
            {showArtistSuggestion && suggestedArtist && (
              <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                No Spotify o artista aparece como <span className="font-medium text-foreground">{suggestedArtist}</span>.
                <button
                  type="button"
                  onClick={() => form.setValue("artist", suggestedArtist, { shouldDirty: true })}
                  className="min-h-8 font-medium text-primary underline-offset-4 hover:underline"
                >
                  Usar esse nome
                </button>
              </p>
            )}
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
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label htmlFor="lyrics">Letra</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!title.trim() || findLyricsMutation.isPending}
                onClick={() => findLyricsMutation.mutate({ title: title.trim(), artist: artist.trim() || undefined })}
              >
                {findLyricsMutation.isPending ? <Loader2 className="animate-spin" /> : <Search />}
                Buscar letra
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => void pasteLyrics()}>
                <ClipboardPaste />
                Colar letra
              </Button>
            </div>
          </div>
          {candidates && (
            <div className="space-y-2 rounded-md border bg-muted/30 p-2" role="region" aria-label="Letras encontradas">
              {candidates.length === 0 ? (
                <p className="p-1 text-sm text-muted-foreground">
                  Nenhuma letra encontrada. Você pode colar a letra no campo abaixo.
                </p>
              ) : (
                <>
                  <p className="px-1 text-xs text-muted-foreground">Escolha a versão certa. Ela substitui a letra atual.</p>
                  {candidates.map((candidate, index) => (
                    <button
                      key={`${candidate.title}-${candidate.artist}-${index}`}
                      type="button"
                      onClick={() => applyCandidate(candidate)}
                      className="block min-h-11 w-full rounded-md border bg-card p-2 text-left hover:bg-accent"
                    >
                      <span className="block truncate text-sm font-medium">{candidate.title}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {candidate.artist}
                        {candidate.album ? ` · ${candidate.album}` : ""}
                      </span>
                      <span className="block truncate text-xs italic text-muted-foreground">{candidate.lyrics.split("\n")[0]}</span>
                    </button>
                  ))}
                </>
              )}
              <Button type="button" variant="ghost" size="sm" onClick={() => setCandidates(null)}>
                Fechar
              </Button>
            </div>
          )}
          <Textarea
            id="lyrics"
            {...form.register("lyrics")}
            rows={10}
            placeholder="Digite a letra da música..."
            className="min-h-48 resize-y"
          />
          <p className="text-xs text-muted-foreground">
            Separe as estrofes com uma linha em branco.
            {slideCount > 0 && ` A apresentação terá ${slideCount} ${slideCount === 1 ? "slide" : "slides"} (mais o de título).`}
          </p>
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
