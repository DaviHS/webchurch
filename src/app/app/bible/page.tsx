"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Bookmark, ChevronDown, ChevronLeft, ChevronRight, Columns2, Copy, Eraser, ListChecks, Loader2, Plus, Projector, Search, StickyNote, X } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useDebounce } from "@/hooks/use-debounce";
import { BIBLE_MARK_COLORS, markColor } from "@/lib/bible-marks";
import { PassagePickerDialog } from "./_components/passage-picker-dialog";
import { ReadingSettings } from "./_components/reading-settings";
import { fontFamilyOf, READING_SIZES, useReadingPrefs } from "@/hooks/use-reading-prefs";
import { VerseNoteDialog } from "./_components/verse-note-dialog";
import { VersesPerSlideSelect } from "@/components/presentation/control/slide-grid";
import { toast } from "sonner";
import { toastError } from "@/lib/toast";
import { PageContainer } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
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
const MAX_COLUMNS = 3;

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

interface VersionInfo {
  code: string;
  name: string;
  language: string;
}

const LANGUAGE_LABELS: Record<string, string> = { pt: "Português", en: "Inglês" };

function VersionSelect({
  value,
  versions,
  taken,
  onChange,
  label,
  className,
}: {
  value: string;
  versions: VersionInfo[];
  taken: string[];
  onChange: (code: string) => void;
  label: string;
  className?: string;
}) {
  const languages = [...new Set(versions.map((v) => v.language))];
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className} aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="max-h-80">
        {languages.map((language) => (
          <SelectGroup key={language}>
            <SelectLabel>{LANGUAGE_LABELS[language] ?? language}</SelectLabel>
            {versions
              .filter((v) => v.language === language)
              .map((v) => (
                <SelectItem key={v.code} value={v.code} disabled={v.code !== value && taken.includes(v.code)}>
                  {v.code} · {v.name}
                </SelectItem>
              ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}

type VerseMarks = Map<number, { color: string | null; note: string | null }>;

function ChapterColumn({
  version,
  location,
  selected,
  marks,
  onToggle,
  onCopy,
  onProject,
}: {
  onCopy?: () => void;
  onProject?: () => void;
  version: string;
  location: Location;
  selected: Set<number>;
  marks: VerseMarks;
  onToggle: (verse: number) => void;
}) {
  const { data, isPending, error } = api.bible.getChapter.useQuery(
    { version, ...location },
    { staleTime: Infinity, refetchOnWindowFocus: false },
  );
  const [reading] = useReadingPrefs();
  const onePerLine = reading.layout === "lines";

  return (
    <section aria-label={`Texto em ${version}`} className="min-w-0 space-y-3 rounded-lg border p-4">
      <div className="flex items-center gap-2">
        <h2 className="min-w-0 flex-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {data?.version.name ?? version}
          <span className="ml-2 rounded bg-muted px-1.5 py-0.5 font-mono normal-case">{version}</span>
        </h2>
        {onCopy && (
          <Button type="button" variant="outline" size="sm" onClick={onCopy}>
            <Copy className="mr-1" /> Copiar
          </Button>
        )}
        {onProject && (
          <Button type="button" size="sm" onClick={onProject}>
            <Projector className="mr-1" /> Projetar
          </Button>
        )}
      </div>
      {isPending && (
        <div className="flex justify-center py-10">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error.message}</p>}
      {data && (
        <div
          className={cn("leading-relaxed", onePerLine && "space-y-1.5")}
          style={{ fontFamily: fontFamilyOf(reading.font), fontSize: READING_SIZES[reading.size] }}
        >
          {data.verses.map((v) => (
            <span
              key={v.verse}
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
  const { data: versions } = api.bible.versions.useQuery(undefined, { staleTime: Infinity });

  const bookParam = Number(params.get("b"));
  const chapterParam = Number(params.get("c"));
  const urlBook = Number.isInteger(bookParam) ? getBook(bookParam) : undefined;
  const hasLocation = !!urlBook && Number.isInteger(chapterParam) && chapterParam >= 1 && chapterParam <= urlBook.chapters;
  const location: Location = hasLocation ? { bookId: urlBook.id, chapter: chapterParam } : { bookId: 1, chapter: 1 };

  const [preferredVersion, setPreferredVersion] = useBibleVersion(versions);

  const selectedVersions = useMemo(() => {
    const codes = (params.get("v") ?? "").split(",").filter((code) => versions?.some((v) => v.code === code));
    const unique = [...new Set(codes)].slice(0, MAX_COLUMNS);
    return unique.length > 0 ? unique : preferredVersion ? [preferredVersion] : [];
  }, [params, versions, preferredVersion]);
  const comparing = selectedVersions.length > 1;

  const go = (next: Location, nextVersions: string[] = selectedVersions) => {
    const query = new URLSearchParams({ b: String(next.bookId), c: String(next.chapter) });
    if (nextVersions.length > 0) query.set("v", nextVersions.join(","));
    router.replace(`/app/bible?${query.toString()}`, { scroll: false });
  };

  const utils = api.useUtils();
  const { data: preferences, isPending: preferencesPending } = api.bible.preferences.useQuery(undefined, {
    staleTime: Infinity,
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
  const [perSlide, setPerSlide] = useState<number | null>(1);

  const firstVersion = selectedVersions[0];
  const { data: firstChapter } = api.bible.getChapter.useQuery(
    { version: firstVersion ?? "", ...location },
    { enabled: !!firstVersion, staleTime: Infinity, refetchOnWindowFocus: false },
  );
  const allVerses = firstChapter?.verses.map((v) => v.verse) ?? [];
  const wholeChapterSelected = allVerses.length > 0 && allVerses.every((verse) => selected.has(verse));
  const toggleWholeChapter = () => selectVerses(location, wholeChapterSelected ? [] : allVerses);
  const pendingScroll = useRef<number | null>(hasInitialVerse ? initialVerse : null);

  useEffect(() => {
    const verse = pendingScroll.current;
    const version = selectedVersions[0];
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

  const setVersionAt = (index: number, code: string) => {
    if (index === 0) setPreferredVersion(code);
    go(location, selectedVersions.map((current, i) => (i === index ? code : current)));
  };

  const addVersion = () => {
    const candidate = versions?.find((v) => !selectedVersions.includes(v.code));
    if (candidate) go(location, [...selectedVersions, candidate.code]);
  };

  const removeVersion = (index: number) => go(location, selectedVersions.filter((_, i) => i !== index));

  const toggleCompare = () => (comparing ? go(location, selectedVersions.slice(0, 1)) : addVersion());

  const project = (version = selectedVersions[0]) => {
    if (!selectionLabel || !version) return;
    const query = new URLSearchParams({ bible: "1", ref: selectionLabel, v: version });
    if (perSlide !== null) query.set("n", String(perSlide));
    window.open(`/presentation/control?${query.toString()}`, "_blank");
  };

  const copy = async (version = selectedVersions[0]) => {
    if (!selectionLabel || !version) return;
    try {
      const passage = await fetchSelectedText(version);
      await navigator.clipboard.writeText(`${passage}\n— ${selectionLabel} (${version})`);
      toast.success("Versículos copiados");
    } catch {
      toastError("Não foi possível copiar.");
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
      .map((v) => v.text)
      .join(" ");
  };

  return (
    <PageContainer>

      <div className="space-y-3">
        <div ref={searchBox} className="relative">
          <form className="flex items-center gap-2" onSubmit={submitSearch}>
            <SearchInput
              value={searchText}
              onChange={onSearchChange}
              placeholder="Ir para (Jo 3:16) ou buscar um texto (“Jesus chorou”)"
              aria-label="Ir para uma referência ou buscar um texto"
            />
            <Button type="submit" disabled={searchText.trim().length < 2} className="shrink-0 max-sm:w-9 max-sm:px-0 sm:w-28" aria-label="Buscar">
              <Search className="sm:mr-1" />
              <span className="hidden sm:inline">Buscar</span>
            </Button>
          </form>

          {textQuery && selectedVersions[0] && (
            <div className="absolute inset-x-0 top-full z-30 mt-1">
              <SearchResults
                key={`${selectedVersions[0]}:${textQuery}`}
                version={selectedVersions[0]}
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

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {versions && (
            <div className="flex min-w-0 flex-1 items-center gap-2">
              {comparing ? (
                <span className="flex-1 text-sm text-muted-foreground">Comparando {selectedVersions.length} versões</span>
              ) : (
                selectedVersions[0] && (
                  <VersionSelect
                    value={selectedVersions[0]}
                    versions={versions}
                    taken={selectedVersions}
                    onChange={(next) => setVersionAt(0, next)}
                    label="Versão"
                    className="w-full min-w-0 flex-1"
                  />
                )
              )}
              <Button type="button" variant={comparing ? "default" : "outline"} className="shrink-0" aria-pressed={comparing} onClick={toggleCompare}>
                <Columns2 />
                <span className="sr-only sm:not-sr-only sm:ml-1">{comparing ? "Comparando" : "Comparar"}</span>
              </Button>
              <ReadingSettings className="shrink-0" />
              <Button asChild variant="outline" size="icon" className="shrink-0">
                <Link href="/app/bible/marks" title="Minhas marcações" aria-label="Minhas marcações">
                  <Bookmark />
                </Link>
              </Button>
            </div>
          )}
        </div>

        {versions && comparing && (
          <div className="space-y-2 rounded-lg border bg-muted/30 p-2">
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {selectedVersions.map((code, index) => (
                <div key={index} className="flex min-w-0 items-center gap-1">
                  <span className="w-6 shrink-0 text-center text-xs font-semibold text-muted-foreground">{index + 1}</span>
                  <VersionSelect
                    value={code}
                    versions={versions}
                    taken={selectedVersions}
                    onChange={(next) => setVersionAt(index, next)}
                    label={index === 0 ? "Versão" : `Versão ${index + 1} da comparação`}
                    className="w-full min-w-0"
                  />
                  {index > 0 ? (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeVersion(index)} aria-label={`Remover ${code} da comparação`}>
                      <X />
                    </Button>
                  ) : (
                    <span className="size-9 shrink-0" aria-hidden />
                  )}
                </div>
              ))}
            </div>
            {selectedVersions.length < MAX_COLUMNS && (
              <Button type="button" variant="outline" size="sm" onClick={addVersion}>
                <Plus className="mr-1" /> Adicionar versão
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="sticky top-[4.5rem] z-10 -mx-1 flex items-center gap-2 bg-background/95 px-1 py-2 backdrop-blur">
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
        <Button
          type="button"
          variant={wholeChapterSelected ? "default" : "outline"}
          size="sm"
          disabled={allVerses.length === 0}
          aria-pressed={wholeChapterSelected}
          onClick={toggleWholeChapter}
          title="Selecionar o capítulo inteiro"
        >
          <ListChecks />
          <span className="sr-only sm:not-sr-only sm:ml-1">Capítulo inteiro</span>
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
        {selectedVersions.map((version) => (
          <ChapterColumn
            key={version}
            version={version}
            location={location}
            selected={selected}
            marks={marks}
            onToggle={toggleVerse}
            onCopy={comparing && selectionLabel ? () => void copy(version) : undefined}
            onProject={comparing && selectionLabel ? () => project(version) : undefined}
          />
        ))}
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

      <PassagePickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        current={location}
        version={selectedVersions[0]}
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
                  {comparing && <span className="ml-2 text-muted-foreground">em {selectedVersions[0]}</span>}
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
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="sm:ml-auto"
              disabled={singleSelectedVerse === null}
              title={singleSelectedVerse === null ? "Selecione um único versículo para anotar" : undefined}
              onClick={() => setNoteVerse(singleSelectedVerse)}
            >
              <StickyNote className="mr-1" /> Anotar
            </Button>
          </div>

          <div className="flex items-center gap-2 border-t pt-2">
            <Button type="button" variant="outline" size="sm" disabled={!selectionLabel} onClick={() => void copy()}>
              <Copy className="mr-1" /> Copiar
            </Button>
            <VersesPerSlideSelect compact value={perSlide} onChange={setPerSlide} className="h-8 min-w-0 flex-1 text-xs sm:ml-auto sm:max-w-40" />
            <Button type="button" size="sm" disabled={!selectionLabel} onClick={() => project()}>
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
