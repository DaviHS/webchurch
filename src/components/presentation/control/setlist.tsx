"use client";

import { useState } from "react";
import { BookOpen, Loader2, Music, Plus, X } from "lucide-react";
import { toastError } from "@/lib/toast";
import { SearchInput } from "@/components/search-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBibleVersion } from "@/hooks/use-bible-version";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import { lyricSlideCount, passageToDeckSong, type Deck, type DeckSong, type DeckSongSource, type Position } from "../deck";
import { VersesPerSlideSelect } from "./slide-grid";

interface SetlistProps {
  deck: Deck;
  live: Position | null;
  selectedSong: number;
  onSelect: (song: number) => void;
  onAddSong: (song: DeckSongSource) => void;
  onAddPassage: (song: DeckSong) => void;
  onRemoveSong: (uid: string) => void;
}

function AddPassage({ onAdd }: { onAdd: (song: DeckSong) => void }) {
  const utils = api.useUtils();
  const { data: versions } = api.bible.versions.useQuery(undefined, { staleTime: Infinity });
  const [version, setVersion] = useBibleVersion(versions);
  const [reference, setReference] = useState("");
  const [perSlide, setPerSlide] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const value = reference.trim();
    if (!value || !version || loading) return;
    setLoading(true);
    try {
      const passage = await utils.bible.getPassage.fetch({ version, reference: value });
      onAdd(passageToDeckSong(passage, `bible:${passage.title}:${version}:${Date.now()}`, perSlide));
      setReference("");
    } catch (error) {
      toastError(error instanceof Error ? error.message : "Não foi possível carregar a passagem.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-3 border-t pt-3" onSubmit={(event) => void submit(event)}>
      <Input
        value={reference}
        onChange={(event) => setReference(event.target.value)}
        placeholder="Passagem: Jo 3:16-18"
        enterKeyHint="go"
        autoCapitalize="none"
        autoCorrect="off"
        aria-label="Passagem bíblica para adicionar"
      />
      <div className="grid grid-cols-2 gap-3">
        <Select value={version ?? undefined} onValueChange={setVersion}>
          <SelectTrigger className="w-full" aria-label="Versão da Bíblia">
            <SelectValue placeholder="Versão" />
          </SelectTrigger>
          <SelectContent>
            {versions?.map((v) => (
              <SelectItem key={v.code} value={v.code}>
                {v.code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <VersesPerSlideSelect compact value={perSlide} onChange={setPerSlide} className="w-full" />
      </div>
      <Button type="submit" className="w-full" disabled={!reference.trim() || !version || loading}>
        {loading ? <Loader2 className="animate-spin" /> : <BookOpen />}
        Adicionar passagem
      </Button>
    </form>
  );
}

function AddSongSearch({ onAdd }: { onAdd: (song: DeckSongSource) => void }) {
  const [term, setTerm] = useState("");
  const debouncedTerm = useDebounce(term, 300);
  const search = debouncedTerm.trim();
  const { data, isFetching } = api.song.list.useQuery(
    { search, limit: 8 },
    { enabled: search.length >= 2, staleTime: 60_000 }
  );

  return (
    <div className="space-y-2">
      <SearchInput
        value={term}
        onChange={setTerm}
        placeholder="Adicionar música…"
        isLoading={isFetching}
        aria-label="Buscar música para adicionar"
      />
      {term.trim().length >= 2 && search.length >= 2 && data && (
        <ul className="max-h-56 space-y-1 overflow-y-auto rounded-md border p-1">
          {data.songs.length === 0 && <li className="px-2 py-2.5 text-xs text-muted-foreground">Nenhuma música encontrada</li>}
          {data.songs.map((song) => (
            <li key={song.id}>
              <button
                type="button"
                className="flex min-h-11 w-full items-center justify-between gap-2 rounded px-2 py-2.5 text-left text-sm hover:bg-accent"
                onClick={() => {
                  onAdd({ id: song.id, title: song.title, artist: song.artist, lyrics: song.lyrics });
                  setTerm("");
                }}
              >
                <span className="truncate">
                  {song.title}
                  {song.artist && <span className="text-muted-foreground"> · {song.artist}</span>}
                </span>
                <Plus className="h-4 w-4 shrink-0" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function Setlist({ deck, live, selectedSong, onSelect, onAddSong, onAddPassage, onRemoveSong }: SetlistProps) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Repertório</h2>
      <ScrollArea className="min-h-0 flex-1 pr-2 [&>[data-radix-scroll-area-viewport]>div]:block!">
        <ol className="space-y-1">
          {deck.songs.length === 0 && (
            <li className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
              O evento não tem músicas. Adicione abaixo.
            </li>
          )}
          {deck.songs.map((song, index) => {
            const isLive = live?.song === index;
            return (
              <li key={song.uid} className="group relative">
                <button
                  type="button"
                  onClick={() => onSelect(index)}
                  className={cn(
                    "flex min-h-11 w-full items-start gap-2 rounded-md border p-2 text-left transition-colors",
                    index === selectedSong ? "border-primary bg-primary/10" : "border-transparent hover:bg-accent",
                    isLive && "ring-2 ring-red-500",
                    song.adHoc && "pr-12"
                  )}
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-muted text-xs font-bold">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{song.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {song.slides.length === 0
                        ? "Sem letra cadastrada"
                        : `${lyricSlideCount(song)} ${song.kind === "bible" ? "slides" : "estrofes"}`}
                      {song.artist ? ` · ${song.artist}` : ""}
                    </span>
                  </span>
                  {isLive && <span className="rounded bg-red-500 px-1 text-xs font-bold text-white">AO VIVO</span>}
                  {song.kind === "bible" && <BookOpen className="h-4 w-4 text-muted-foreground" />}
                  {song.kind === "song" && song.slides.length === 0 && <Music className="h-4 w-4 text-amber-500" />}
                </button>
                {song.adHoc && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 focus-visible:opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100"
                    onClick={() => onRemoveSong(song.uid)}
                    aria-label={`Remover ${song.title}`}
                  >
                    <X />
                  </Button>
                )}
              </li>
            );
          })}
        </ol>
      </ScrollArea>
      <AddSongSearch onAdd={onAddSong} />
      <AddPassage onAdd={onAddPassage} />
    </div>
  );
}
