"use client";

import { ErrorDisplay } from "@/components/ui/error-display";
import { Fragment, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Bookmark, BookOpenCheck, ChevronDown, ChevronLeft, ChevronRight, Columns2, Copy, Eraser, ListChecks, Loader2, Projector, Search, Share2, StickyNote, X } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useDebounce } from "@/hooks/use-debounce";
import { BIBLE_MARK_COLORS, markColor } from "@/lib/bible-marks";
import { PassagePickerDialog } from "./_components/passage-picker-dialog";
import { CompareDialog } from "./_components/compare-dialog";
import { VersionSelect } from "./_components/version-select";
import { OfflinePrompt } from "./_components/offline-prompt";
import { ReadingSettings } from "./_components/reading-settings";
import { fontFamilyOf, READING_SIZES, useReadingPrefs } from "@/hooks/use-reading-prefs";
import { VerseNoteDialog } from "./_components/verse-note-dialog";
import { toast } from "sonner";
import { toastError } from "@/lib/toast";
import { PageContainer } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBibleVersion } from "@/hooks/use-bible-version";
import {
  formatChapterTitle,
  getBook,
  neighborChapter,
  parseReference,
} from "@/lib/bible";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";

const EMPTY_SELECTION = new Set<number>();
const LAST_READ_KEY = "bible-last-read";

interface Location {
  bookId: number;
  chapter: number;
}

function readLastLocation(): Location | null {
  try {
    const raw = localStorage.getItem(LAST_READ_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Location>;
    const book = typeof parsed.bookId === "number" ? getBook(parsed.bookId) : undefined;
    if (!book || typeof parsed.chapter !== "number" || parsed.chapter < 1 || parsed.chapter > book.chapters) return null;
    return { bookId: book.id, chapter: parsed.chapter };
  } catch {
    return null;
  }
}

function saveLastLocation(location: Location) {
  try {
    localStorage.setItem(LAST_READ_KEY, JSON.stringify(location));
  } catch {
    return;
  }
}

function toRuns(verses: number[]): [number, number][] {
  const runs: [number, number][] = [];
  for (const verse of [...verses].sort((a, b) => a - b)) {
    const last = runs[runs.length - 1];
    if (last && verse === last[1] + 1) last[1] = verse;
    else runs.push([verse, verse]);
  }
  return runs;
}

type VerseMarks = Map<number, { color: string | null; note: string | null }>;

function ChapterColumn({
  version,
  location,
  selected,
  marks,
  onToggle,
}: {
  version: string;
  location: Location;
  selected: Set<number>;
  marks: VerseMarks;
  onToggle: (verse: number) => void;
}) {
  const { data, isPending, error, refetch } = api.bible.getChapter.useQuery(
    { version, ...location },
    { staleTime: Infinity, networkMode: "always", refetchOnWindowFocus: false },
  );
  const [reading] = useReadingPrefs();
  const onePerLine = reading.layout === "lines";
  const headingAt = new Map(data?.headings.map((heading) => [heading.verse, heading.title]));

  return (
    <section aria-label={`Texto em ${version}`} className="min-w-0 space-y-3 rounded-lg border p-4">
      {isPending && (
        <div className="flex justify-center py-10">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      )}
      {error && <ErrorDisplay message={error.message} onRetry={() => void refetch()} className="mt-0" />}
      {data && (
        <div
          className={cn("leading-relaxed", onePerLine && "space-y-1.5")}
          style={{ fontFamily: fontFamilyOf(reading.font), fontSize: READING_SIZES[reading.size] }}
        >
          {data.verses.map((v) => (
            <Fragment key={v.verse}>
              {headingAt.get(v.verse) && (
                <span className="block pb-1 pt-3 text-[0.8em] font-semibold text-primary first:pt-0">{headingAt.get(v.verse)}</span>
              )}
            <span
              id={`${version}-v${v.verse}`}
              role="button"
              tabIndex={0}
              aria-pressed={selected.has(v.verse)}
              onClick={() => onToggle(v.verse)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onToggle(v.verse);
                }
              }}
              className={cn(
                "cursor-pointer rounded px-0.5 decoration-primary/60 underline-offset-4 hover:bg-accent focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring",
                onePerLine && "block px-1 py-0.5",
                markColor(marks.get(v.verse)?.color)?.highlight,
                selected.has(v.verse) && "bg-primary/15 underline",
              )}
            >
              <sup className="mr-1 text-[0.7em] font-bold text-primary">
                {v.verse}
                {marks.get(v.verse)?.note && <StickyNote className="ml-0.5 inline size-3" aria-label="Tem anotação" />}
              </sup>
              {v.text}{" "}
            </span>
            </Fragment>
          ))}
        </div>
      )}
    </section>
  );
}

const SEARCH_IDLE_MS = 900;
const SEARCH_STEP = 30;
const SEARCH_MAX = 200;
const SEARCH_SCOPES = [
  { value: "all", label: "Toda a Bíblia" },
  { value: "ot", label: "Antigo Testamento" },
  { value: "nt", label: "Novo Testamento" },
] as const;
type SearchScope = (typeof SEARCH_SCOPES)[number]["value"];

const fold = (text: string) => text.replace(/[À-ſ]/g, (char) => char.normalize("NFD").replace(/\p{M}/gu, ""));

/** Destaca no texto os termos digitados, ignorando acentos e maiúsculas. */
function Highlighted({ text, query }: { text: string; query: string }) {
  const terms = [...new Set(fold(query.toLowerCase()).match(/[\p{L}\p{N}]{2,}/gu) ?? [])];
  if (terms.length === 0) return <>{text}</>;
  const folded = fold(text.toLowerCase());
  const pattern = new RegExp(terms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"), "g");
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const match of folded.matchAll(pattern)) {
    if (match.index === undefined || folded.length !== text.length) break;
    parts.push(text.slice(last, match.index));
    parts.push(
      <mark key={match.index} className="rounded bg-yellow-200 px-0.5 text-foreground dark:bg-yellow-500/40">
        {text.slice(match.index, match.index + match[0].length)}
      </mark>,
    );
    last = match.index + match[0].length;
  }
  parts.push(text.slice(last));
  return <>{parts}</>;
}

function SearchResults({
  version,
  query,
  onPick,
  onClose,
}: {
  version: string;
  query: string;
  onPick: (location: Location, verse: number) => void;
  onClose: () => void;
}) {
  const [scope, setScope] = useState<SearchScope>("all");
  const [limit, setLimit] = useState(SEARCH_STEP);
  const { data, isFetching, error } = api.bible.search.useQuery(
    { version, query, scope, limit },
    { staleTime: 60_000, placeholderData: (previous) => previous },
  );
  const hits = data?.hits ?? [];
  return (
    <div className="space-y-2 rounded-lg border bg-background p-3 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Resultados em {version}
          {data && ` · ${hits.length}${data.hasMore ? "+" : ""}`}
          {isFetching && <Loader2 className="ml-1 inline size-3 animate-spin" />}
        </p>
        <Select
          value={scope}
          onValueChange={(value) => {
            setScope(SEARCH_SCOPES.find((option) => option.value === value)?.value ?? "all");
            setLimit(SEARCH_STEP);
          }}
        >
          <SelectTrigger className="h-8 w-44 text-xs" aria-label="Onde buscar">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SEARCH_SCOPES.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="button" variant="ghost" size="icon-sm" onClick={onClose} aria-label="Fechar resultados">
          <X />
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error.message}</p>}
      {data && hits.length === 0 && <p className="text-sm text-muted-foreground">Nada encontrado.</p>}
      <ul className="max-h-96 space-y-1 overflow-y-auto">
        {hits.map((hit) => (
          <li key={`${hit.bookId}:${hit.chapter}:${hit.verse}`}>
            <button
              type="button"
              className="w-full rounded px-2 py-2 text-left text-sm hover:bg-accent"
              onClick={() => onPick({ bookId: hit.bookId, chapter: hit.chapter }, hit.verse)}
            >
              <span className="font-semibold">
                {formatChapterTitle(getBook(hit.bookId)!, hit.chapter)}:{hit.verse}
              </span>
              <span className="ml-2 text-muted-foreground">
                <Highlighted text={hit.text} query={query} />
              </span>
            </button>
          </li>
        ))}
      </ul>
      {data?.hasMore && limit < SEARCH_MAX && (
        <Button type="button" variant="outline" size="sm" className="w-full" disabled={isFetching} onClick={() => setLimit(limit + SEARCH_STEP)}>
          Mostrar mais
        </Button>
      )}
      {data?.hasMore && limit >= SEARCH_MAX && (
        <p className="text-xs text-muted-foreground">Muitos resultados. Refine a busca com mais palavras ou use aspas para uma frase exata.</p>
      )}
    </div>
  );
}

function BibleReader() {
  const router = useRouter();
  const params = useSearchParams();
  const { data: versions } = api.bible.versions.useQuery(undefined, { staleTime: Infinity, networkMode: "always" });

  const bookParam = Number(params.get("b"));
  const chapterParam = Number(params.get("c"));
  const urlBook = Number.isInteger(bookParam) ? getBook(bookParam) : undefined;
  const hasLocation = !!urlBook && Number.isInteger(chapterParam) && chapterParam >= 1 && chapterParam <= urlBook.chapters;
  const location: Location = hasLocation ? { bookId: urlBook.id, chapter: chapterParam } : { bookId: 1, chapter: 1 };

  const [preferredVersion, setPreferredVersion] = useBibleVersion(versions);

  const urlVersion = params.get("v")?.split(",")[0];
  const version = (versions?.some((v) => v.code === urlVersion) ? urlVersion : undefined) ?? preferredVersion ?? undefined;

  const go = (next: Location, nextVersion: string | undefined = version) => {
    const query = new URLSearchParams({ b: String(next.bookId), c: String(next.chapter) });
    if (nextVersion) query.set("v", nextVersion);
    router.replace(`/app/bible?${query.toString()}`, { scroll: false });
  };

  const utils = api.useUtils();
  const { data: preferences, isPending: preferencesPending } = api.bible.preferences.useQuery(undefined, {
    staleTime: Infinity, networkMode: "always",
    refetchOnWindowFocus: false,
  });
  const { mutate: savePreferences } = api.bible.savePreferences.useMutation();

  // Sem passagem na URL: retoma a última leitura do perfil (ou, se faltar, a deste navegador).
  useEffect(() => {
    if (hasLocation || preferencesPending) return;
    const savedBook = preferences?.bookId ? getBook(preferences.bookId) : undefined;
    const fromProfile =
      savedBook && preferences?.chapter && preferences.chapter >= 1 && preferences.chapter <= savedBook.chapters
        ? { bookId: savedBook.id, chapter: preferences.chapter }
        : null;
    const last = fromProfile ?? readLastLocation();
    if (last) {
      router.replace(`/app/bible?b=${last.bookId}&c=${last.chapter}`, { scroll: false });
    }
  }, [hasLocation, preferencesPending, preferences, router]);

  useEffect(() => {
    if (!hasLocation) return;
    const current = { bookId: location.bookId, chapter: location.chapter };
    saveLastLocation(current);
    utils.bible.preferences.setData(undefined, (previous) => ({ version: null, ...previous, bookId: current.bookId, chapter: current.chapter }));
    // Espera a pessoa parar de virar capítulos antes de gravar no perfil.
    const timer = setTimeout(() => savePreferences({ location: current }), 1500);
    return () => clearTimeout(timer);
  }, [hasLocation, location.bookId, location.chapter, savePreferences, utils]);

  const key = `${location.bookId}:${location.chapter}`;
  // Vindo de "Minhas marcações", o versículo escolhido chega em ?s= e já abre selecionado.
  const [initialVerse] = useState(() => Number(params.get("s")));
  const hasInitialVerse = Number.isInteger(initialVerse) && initialVerse >= 1;
  const [selection, setSelection] = useState<{ key: string; verses: Set<number> }>({
    key,
    verses: hasInitialVerse ? new Set([initialVerse]) : new Set(),
  });
  const selected = selection.key === key ? selection.verses : EMPTY_SELECTION;
  const selectVerses = (target: Location, verses: number[]) =>
    setSelection({ key: `${target.bookId}:${target.chapter}`, verses: new Set(verses) });

  const toggleVerse = (verse: number) => {
    const next = new Set(selected);
    if (next.has(verse)) next.delete(verse);
    else next.add(verse);
    setSelection({ key, verses: next });
  };

  const [searchText, setSearchText] = useState("");
  const [textQuery, setTextQuery] = useState<string | null>(null);

  const { data: firstChapter } = api.bible.getChapter.useQuery(
    { version: version ?? "", ...location },
    { enabled: !!version, staleTime: Infinity, networkMode: "always", refetchOnWindowFocus: false },
  );
  const allVerses = firstChapter?.verses.map((v) => v.verse) ?? [];
  const wholeChapterSelected = allVerses.length > 0 && allVerses.every((verse) => selected.has(verse));
  const toggleWholeChapter = () => selectVerses(location, wholeChapterSelected ? [] : allVerses);
  const pendingScroll = useRef<number | null>(hasInitialVerse ? initialVerse : null);

  useEffect(() => {
    const verse = pendingScroll.current;
    if (verse === null || !version) return;
    const element = document.getElementById(`${version}-v${verse}`);
    if (element) {
      element.scrollIntoView({ block: "center", behavior: "smooth" });
      pendingScroll.current = null;
    }
  });

  const lastSearched = useRef("");
  const runSearch = (raw: string) => {
    const value = raw.trim();
    if (!value) return;
    lastSearched.current = value;
    const ref = parseReference(value);
    if (ref) {
      setTextQuery(null);
      go({ bookId: ref.book.id, chapter: ref.chapter });
      if (ref.verseStart !== null) {
        const start = ref.verseStart;
        const end = ref.verseEnd ?? start;
        selectVerses(
          { bookId: ref.book.id, chapter: ref.chapter },
          Array.from({ length: end - start + 1 }, (_, i) => start + i),
        );
        pendingScroll.current = start;
      }
    } else if (value.length >= 2) {
      setTextQuery(value);
    }
  };

  // Busca sozinha quando a pessoa para de digitar.
  const searchRef = useRef(runSearch);
  useEffect(() => {
    searchRef.current = runSearch;
  });
  const idleText = useDebounce(searchText, SEARCH_IDLE_MS).trim();
  useEffect(() => {
    if (idleText.length >= 3 && idleText !== lastSearched.current) searchRef.current(idleText);
  }, [idleText]);

  const onSearchChange = (value: string) => {
    setSearchText(value);
    if (value === "") {
      lastSearched.current = "";
      setTextQuery(null);
    }
  };

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    runSearch(searchText);
  };

  // Toque fora (ou Esc) fecha os resultados da busca.
  const searchBox = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!textQuery) return;
    const close = () => setTextQuery(null);
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (!target || searchBox.current?.contains(target)) return;
      // O seletor "Onde buscar" abre numa camada própria, fora da caixa.
      if (target.closest("[role='listbox'], [data-radix-popper-content-wrapper]")) return;
      close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [textQuery]);

  const book = getBook(location.bookId)!;
  const prev = neighborChapter(location.bookId, location.chapter, -1);
  const next = neighborChapter(location.bookId, location.chapter, 1);
  const locationTitle = (target: Location) => {
    const targetBook = getBook(target.bookId);
    return targetBook ? formatChapterTitle(targetBook, target.chapter) : "";
  };
  const goToChapter = (target: Location | null) => {
    if (!target) return;
    go(target);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const runs = toRuns([...selected]);
  const singleRun = runs.length === 1 ? runs[0]! : null;
  const selectionLabel = singleRun
    ? `${formatChapterTitle(book, location.chapter)}:${singleRun[0] === singleRun[1] ? singleRun[0] : `${singleRun[0]}-${singleRun[1]}`}`
    : null;

  const changeVersion = (code: string) => {
    setPreferredVersion(code);
    go(location, code);
  };

  const project = (code = version) => {
    if (!selectionLabel || !code) return;
    const query = new URLSearchParams({ bible: "1", ref: selectionLabel, v: code, n: "1" });
    window.open(`/presentation/control?${query.toString()}`, "_blank");
  };

  const copy = async (code = version) => {
    if (!selectionLabel || !code) return;
    try {
      const passage = await fetchSelectedText(code);
      await navigator.clipboard.writeText(`${passage}\n— ${selectionLabel} (${code})`);
      toast.success("Versículos copiados");
    } catch {
      toastError("Não foi possível copiar.");
    }
  };

  // Abre o WhatsApp com o texto e um link que leva direto a estes versículos no app.
  const share = async (code = version) => {
    if (!selectionLabel || !code || !singleRun) return;
    try {
      const passage = await fetchSelectedText(code);
      const link = `${window.location.origin}/app/bible?${new URLSearchParams({ b: String(location.bookId), c: String(location.chapter), s: String(singleRun[0]), v: code })}`;
      const message = `*${selectionLabel} (${code})*
${passage}

Abrir no app: ${link}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
    } catch {
      toastError("Não foi possível compartilhar.");
    }
  };

  const { data: chapterMarks = [] } = api.bible.chapterMarks.useQuery(location, { staleTime: 60_000, placeholderData: (previous) => previous });
  const marks = useMemo<VerseMarks>(
    () => new Map(chapterMarks.map((mark) => [mark.verse, { color: mark.color, note: mark.note }])),
    [chapterMarks],
  );
  const notedVerses = chapterMarks.filter((mark) => mark.note);

  const [noteVerse, setNoteVerse] = useState<number | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const compareLabel = runs.length > 0
    ? `${formatChapterTitle(book, location.chapter)}:${runs.map(([from, to]) => (from === to ? from : `${from}-${to}`)).join(", ")}`
    : "";

  const setMarksMutation = api.bible.setMarks.useMutation({
    onSuccess: async (_data, variables) => {
      await utils.bible.chapterMarks.invalidate();
      setSelection({ key, verses: new Set() });
      toast.success(variables.color ? "Versículos marcados" : "Marcação removida");
    },
    onError: () => toastError("Não foi possível salvar a marcação."),
  });

  const setNoteMutation = api.bible.setNote.useMutation({
    onSuccess: async (_data, variables) => {
      await utils.bible.chapterMarks.invalidate();
      setNoteVerse(null);
      setSelection({ key, verses: new Set() });
      toast.success(variables.note ? "Anotação salva" : "Anotação excluída");
    },
    onError: () => toastError("Não foi possível salvar a anotação."),
  });

  const applyColor = (color: (typeof BIBLE_MARK_COLORS)[number]["value"] | null) =>
    setMarksMutation.mutate({ ...location, verses: [...selected], color });

  const singleSelectedVerse = selected.size === 1 ? ([...selected][0] ?? null) : null;

  const fetchSelectedText = async (version: string) => {
    const data = await utils.bible.getChapter.fetch({ version, ...location });
    return data.verses
      .filter((v) => selected.has(v.verse))
      .map((v) => `${v.verse}. ${v.text}`)
      .join("\n");
  };

  return (
    <PageContainer>
      <OfflinePrompt version={version} />

      <div className="space-y-3">
        <div ref={searchBox} className="relative">
          <form className="flex items-center gap-2" onSubmit={submitSearch}>
            <SearchInput
              value={searchText}
              onChange={onSearchChange}
              placeholder="Ir para (Jo 3:16) ou buscar um texto (“Jesus chorou”)"
              aria-label="Ir para uma referência ou buscar um texto"
              className="min-w-0 flex-1"
            />
            <Button type="submit" disabled={searchText.trim().length < 2} className="shrink-0 max-sm:w-9 max-sm:px-0 sm:w-28" aria-label="Buscar">
              <Search className="sm:mr-1" />
              <span className="hidden sm:inline">Buscar</span>
            </Button>
            <ReadingSettings className="shrink-0" version={version} />
            <Button asChild variant="outline" size="icon" className="shrink-0">
              <Link href="/app/bible/marks" title="Minhas marcações" aria-label="Minhas marcações">
                <Bookmark />
              </Link>
            </Button>
          </form>

          {textQuery && version && (
            <div className="absolute inset-x-0 top-full z-30 mt-1">
              <SearchResults
                key={`${version}:${textQuery}`}
                version={version}
                query={textQuery}
                onClose={() => setTextQuery(null)}
                onPick={(target, verse) => {
                  go(target);
                  selectVerses(target, [verse]);
                  pendingScroll.current = verse;
                  setTextQuery(null);
                }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="sticky top-16 z-10 -mx-1 flex items-center gap-2 bg-background/95 px-1 py-2 backdrop-blur">
        <h2 className="min-w-0 flex-1 text-xl font-bold">
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            aria-haspopup="dialog"
            title="Escolher livro, capítulo e versículo"
            className="flex max-w-full items-center gap-1 rounded-md hover:text-primary focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="truncate">{formatChapterTitle(book, location.chapter)}</span>
            <ChevronDown className="size-5 shrink-0 text-muted-foreground" />
          </button>
        </h2>
        {version && versions && (
          <VersionSelect
            value={version}
            versions={versions}
            taken={[version]}
            onChange={changeVersion}
            label="Versão"
            className="w-auto shrink-0 gap-1 px-2 py-0 text-xs h-10 sm:h-8"
          />
        )}
        <Button
          type="button"
          variant={wholeChapterSelected ? "default" : "outline"}
          size="icon-sm"
          className="shrink-0"
          disabled={allVerses.length === 0}
          aria-pressed={wholeChapterSelected}
          onClick={toggleWholeChapter}
          title="Selecionar o capítulo inteiro"
        >
          <ListChecks />
          <span className="sr-only">Capítulo inteiro</span>
        </Button>
        <Button type="button" variant="outline" size="icon-sm" disabled={!prev} onClick={() => prev && go(prev)} aria-label="Capítulo anterior">
          <ChevronLeft />
        </Button>
        <Button type="button" variant="outline" size="icon-sm" disabled={!next} onClick={() => next && go(next)} aria-label="Próximo capítulo">
          <ChevronRight />
        </Button>
      </div>

      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, 22rem), 1fr))` }}
      >
        {version && (
          <ChapterColumn
            version={version}
            location={location}
            selected={selected}
            marks={marks}
            onToggle={toggleVerse}
          />
        )}
      </div>

      {notedVerses.length > 0 && (
        <Collapsible className="rounded-lg border">
          <CollapsibleTrigger className="group flex w-full items-center gap-2 p-3 text-left text-sm font-semibold">
            <StickyNote className="size-4 shrink-0 text-primary" />
            <span className="flex-1">Minhas anotações ({notedVerses.length})</span>
            <ChevronDown className="size-4 shrink-0 transition-transform group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ul className="space-y-1 px-2 pb-2">
              {notedVerses.map((mark) => (
                <li key={mark.verse}>
                  <button
                    type="button"
                    className="flex w-full items-start gap-2 rounded px-2 py-2 text-left text-sm hover:bg-accent"
                    onClick={() => setNoteVerse(mark.verse)}
                  >
                    <span className="shrink-0 font-semibold">v. {mark.verse}</span>
                    <span className="line-clamp-2 min-w-0 whitespace-pre-line text-muted-foreground">{mark.note}</span>
                  </button>
                </li>
              ))}
            </ul>
          </CollapsibleContent>
        </Collapsible>
      )}

      {(prev ?? next) && (
        <nav aria-label="Navegar entre capítulos" className="grid grid-cols-2 gap-2">
          <Button type="button" variant="outline" className="justify-start overflow-hidden" disabled={!prev} onClick={() => goToChapter(prev)}>
            <ChevronLeft className="mr-1 shrink-0" />
            <span className="truncate">{prev ? locationTitle(prev) : "Início"}</span>
          </Button>
          <Button type="button" variant="outline" className="justify-end overflow-hidden" disabled={!next} onClick={() => goToChapter(next)}>
            <span className="truncate">{next ? locationTitle(next) : "Fim"}</span>
            <ChevronRight className="ml-1 shrink-0" />
          </Button>
        </nav>
      )}

      <div className="flex justify-center">
        <Button asChild variant="ghost" size="sm">
          <Link href="/app/bible/plan">
            <BookOpenCheck className="mr-1" /> Plano de leitura
          </Link>
        </Button>
      </div>

      <PassagePickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        current={location}
        version={version}
        onPick={(target, verse) => {
          setPickerOpen(false);
          go(target);
          if (verse === null) {
            window.scrollTo({ top: 0, behavior: "smooth" });
          } else {
            selectVerses(target, [verse]);
            pendingScroll.current = verse;
          }
        }}
      />

      {version && versions && versions.length > 1 && (
        <CompareDialog
          open={compareOpen}
          onOpenChange={setCompareOpen}
          reference={compareLabel}
          location={location}
          verses={[...selected].sort((a, b) => a - b)}
          versions={versions}
          baseVersion={version}
          canProject={!!selectionLabel}
          onCopy={(code) => void copy(code)}
          onProject={project}
        />
      )}

      <VerseNoteDialog
        open={noteVerse !== null}
        onOpenChange={(open) => !open && setNoteVerse(null)}
        reference={noteVerse !== null ? `${formatChapterTitle(book, location.chapter)}:${noteVerse}` : ""}
        verseText={firstChapter?.verses.find((v) => v.verse === noteVerse)?.text}
        initialNote={(noteVerse !== null ? marks.get(noteVerse)?.note : null) ?? ""}
        isSaving={setNoteMutation.isPending}
        onSave={(note) => noteVerse !== null && setNoteMutation.mutate({ ...location, verse: noteVerse, note })}
      />

      {selected.size > 0 && (
        <div className="sticky bottom-[calc(5rem+env(safe-area-inset-bottom))] z-50 space-y-2 rounded-lg border bg-background p-2.5 shadow-lg md:bottom-3">
          <div className="flex items-center gap-2">
            <p className="min-w-0 flex-1 truncate text-sm">
              {selectionLabel ? (
                <>
                  <span className="font-semibold">{selectionLabel}</span>
                </>
              ) : (
                <span className="text-muted-foreground">Para projetar, selecione versículos em sequência.</span>
              )}
            </p>
            <Button type="button" variant="ghost" size="icon-sm" onClick={() => setSelection({ key, verses: new Set() })} aria-label="Limpar seleção">
              <X />
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex flex-1 items-center justify-between gap-1.5 sm:flex-none sm:justify-start" role="group" aria-label="Marcar com uma cor">
              {BIBLE_MARK_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  className={cn("size-7 rounded-full border border-foreground/20 disabled:opacity-50", color.swatch)}
                  disabled={setMarksMutation.isPending}
                  onClick={() => applyColor(color.value)}
                  title={`Marcar de ${color.label.toLowerCase()}`}
                  aria-label={`Marcar de ${color.label.toLowerCase()}`}
                />
              ))}
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={setMarksMutation.isPending}
                onClick={() => applyColor(null)}
                title="Remover marcação"
                aria-label="Remover marcação"
              >
                <Eraser />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 border-t pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={singleSelectedVerse === null}
              title={singleSelectedVerse === null ? "Selecione um único versículo para anotar" : "Anotar"}
              onClick={() => setNoteVerse(singleSelectedVerse)}
            >
              <StickyNote className="sm:mr-1" /> <span className="sr-only sm:not-sr-only">Anotar</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!versions || versions.length < 2}
              onClick={() => setCompareOpen(true)}
              title="Comparar versões"
            >
              <Columns2 className="sm:mr-1" /> <span className="sr-only sm:not-sr-only">Comparar</span>
            </Button>
            <Button type="button" variant="outline" size="sm" disabled={!selectionLabel} onClick={() => void copy()} title="Copiar">
              <Copy className="sm:mr-1" /> <span className="sr-only sm:not-sr-only">Copiar</span>
            </Button>
            <Button type="button" variant="outline" size="sm" disabled={!selectionLabel} onClick={() => void share()} title="Compartilhar no WhatsApp">
              <Share2 className="sm:mr-1" /> <span className="sr-only sm:not-sr-only">WhatsApp</span>
            </Button>
            <Button type="button" size="sm" className="ml-auto" disabled={!selectionLabel} onClick={() => project()}>
              <Projector className="mr-1" /> Projetar
            </Button>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

export default function BiblePage() {
  return (
    <Suspense>
      <BibleReader />
    </Suspense>
  );
}
