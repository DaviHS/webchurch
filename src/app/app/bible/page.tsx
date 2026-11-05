"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BookOpen, ChevronLeft, ChevronRight, Columns2, Copy, ListChecks, Loader2, Plus, Projector, X } from "lucide-react";
import { VersesPerSlideSelect } from "@/components/presentation/control/slide-grid";
import { toast } from "sonner";
import { PageContainer, PageHeader } from "@/components/page-header";
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
  BIBLE_BOOKS,
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

function ChapterColumn({
  version,
  location,
  selected,
  onToggle,
  onCopy,
  onProject,
}: {
  onCopy?: () => void;
  onProject?: () => void;
  version: string;
  location: Location;
  selected: Set<number>;
  onToggle: (verse: number) => void;
}) {
  const { data, isPending, error } = api.bible.getChapter.useQuery(
    { version, ...location },
    { staleTime: Infinity, refetchOnWindowFocus: false },
  );

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
        <p className="leading-relaxed">
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
                selected.has(v.verse) && "bg-primary/15 underline",
              )}
            >
              <sup className="mr-1 text-xs font-bold text-primary">{v.verse}</sup>
              {v.text}{" "}
            </span>
          ))}
        </p>
      )}
    </section>
  );
}

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
}: {
  version: string;
  query: string;
  onPick: (location: Location, verse: number) => void;
}) {
  const [scope, setScope] = useState<SearchScope>("all");
  const [limit, setLimit] = useState(SEARCH_STEP);
  const { data, isFetching, error } = api.bible.search.useQuery(
    { version, query, scope, limit },
    { staleTime: 60_000, placeholderData: (previous) => previous },
  );
  const hits = data?.hits ?? [];
  return (
    <div className="space-y-2 rounded-lg border p-3">
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

  useEffect(() => {
    if (hasLocation) return;
    const last = readLastLocation();
    if (last) {
      router.replace(`/app/bible?b=${last.bookId}&c=${last.chapter}`, { scroll: false });
    }
  }, [hasLocation, router]);

  useEffect(() => {
    if (hasLocation) saveLastLocation({ bookId: location.bookId, chapter: location.chapter });
  }, [hasLocation, location.bookId, location.chapter]);

  const key = `${location.bookId}:${location.chapter}`;
  const [selection, setSelection] = useState<{ key: string; verses: Set<number> }>({ key, verses: new Set() });
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
  const [perSlide, setPerSlide] = useState<number | null>(null);

  const firstVersion = selectedVersions[0];
  const { data: firstChapter } = api.bible.getChapter.useQuery(
    { version: firstVersion ?? "", ...location },
    { enabled: !!firstVersion, staleTime: Infinity, refetchOnWindowFocus: false },
  );
  const allVerses = firstChapter?.verses.map((v) => v.verse) ?? [];
  const wholeChapterSelected = allVerses.length > 0 && allVerses.every((verse) => selected.has(verse));
  const toggleWholeChapter = () => selectVerses(location, wholeChapterSelected ? [] : allVerses);
  const pendingScroll = useRef<number | null>(null);

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

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const value = searchText.trim();
    if (!value) return;
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

  const book = getBook(location.bookId)!;
  const prev = neighborChapter(location.bookId, location.chapter, -1);
  const next = neighborChapter(location.bookId, location.chapter, 1);

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
      toast.error("Não foi possível copiar.");
    }
  };

  const utils = api.useUtils();
  const fetchSelectedText = async (version: string) => {
    const data = await utils.bible.getChapter.fetch({ version, ...location });
    return data.verses
      .filter((v) => selected.has(v.verse))
      .map((v) => v.text)
      .join(" ");
  };

  return (
    <PageContainer>
      <PageHeader title="Bíblia" icon={BookOpen} description="Leia, compare versões e projete no telão." />

      <div className="space-y-3">
        <form className="flex flex-col gap-2 sm:flex-row" onSubmit={submitSearch}>
          <SearchInput
            value={searchText}
            onChange={(value) => {
              setSearchText(value);
              if (value === "") setTextQuery(null);
            }}
            placeholder="Ir para (Jo 3:16) ou buscar um texto (“Jesus chorou”)"
            aria-label="Ir para uma referência ou buscar um texto"
          />
          <Button type="submit" disabled={searchText.trim().length < 2} className="sm:w-28">
            Buscar
          </Button>
        </form>

        {textQuery && selectedVersions[0] && (
          <div className="space-y-2">
            <div className="flex justify-end">
              <Button type="button" variant="ghost" size="sm" onClick={() => setTextQuery(null)}>
                <X className="mr-1" /> Fechar resultados
              </Button>
            </div>
            <SearchResults
              key={`${selectedVersions[0]}:${textQuery}`}
              version={selectedVersions[0]}
              query={textQuery}
              onPick={(target, verse) => {
                go(target);
                selectVerses(target, [verse]);
                pendingScroll.current = verse;
                setTextQuery(null);
              }}
            />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Select value={String(location.bookId)} onValueChange={(value) => go({ bookId: Number(value), chapter: 1 })}>
            <SelectTrigger className="w-full sm:w-52" aria-label="Livro">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-80">
              {BIBLE_BOOKS.map((b) => (
                <SelectItem key={b.id} value={String(b.id)}>
                  {b.namePt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(location.chapter)} onValueChange={(value) => go({ bookId: location.bookId, chapter: Number(value) })}>
            <SelectTrigger className="w-28" aria-label="Capítulo">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-80">
              {Array.from({ length: book.chapters }, (_, i) => i + 1).map((chapter) => (
                <SelectItem key={chapter} value={String(chapter)}>
                  Cap. {chapter}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" variant="outline" size="icon" disabled={!prev} onClick={() => prev && go(prev)} aria-label="Capítulo anterior">
            <ChevronLeft />
          </Button>
          <Button type="button" variant="outline" size="icon" disabled={!next} onClick={() => next && go(next)} aria-label="Próximo capítulo">
            <ChevronRight />
          </Button>
          <Button
            type="button"
            variant={wholeChapterSelected ? "default" : "outline"}
            disabled={allVerses.length === 0}
            aria-pressed={wholeChapterSelected}
            onClick={toggleWholeChapter}
          >
            <ListChecks className="mr-1" /> Capítulo inteiro
          </Button>

        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 p-2">
          {versions && selectedVersions.map((code, index) => (
            <div key={index} className="flex w-full items-center gap-1 sm:w-auto">
              {comparing && (
                <span className="w-6 shrink-0 text-center text-xs font-semibold text-muted-foreground">{index + 1}</span>
              )}
              <VersionSelect
                value={code}
                versions={versions}
                taken={selectedVersions}
                onChange={(next) => setVersionAt(index, next)}
                label={index === 0 ? "Versão" : `Versão ${index + 1} da comparação`}
                className="w-full sm:w-72"
              />
              {index > 0 && (
                <Button type="button" variant="ghost" size="icon" onClick={() => removeVersion(index)} aria-label={`Remover ${code} da comparação`}>
                  <X />
                </Button>
              )}
            </div>
          ))}
          {versions && (
            <div className="flex items-center gap-2 sm:ml-auto">
              {comparing && selectedVersions.length < MAX_COLUMNS && (
                <Button type="button" variant="outline" size="sm" onClick={addVersion}>
                  <Plus className="mr-1" /> Versão
                </Button>
              )}
              <Button type="button" variant={comparing ? "default" : "outline"} size="sm" aria-pressed={comparing} onClick={toggleCompare}>
                <Columns2 className="mr-1" /> {comparing ? "Comparando" : "Comparar"}
              </Button>
            </div>
          )}
        </div>
      </div>

      <h2 className="text-xl font-bold">{formatChapterTitle(book, location.chapter)}</h2>

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
            onToggle={toggleVerse}
            onCopy={comparing && selectionLabel ? () => void copy(version) : undefined}
            onProject={comparing && selectionLabel ? () => project(version) : undefined}
          />
        ))}
      </div>

      {selected.size > 0 && (
        <div className="sticky bottom-3 z-10 flex flex-wrap items-center gap-2 rounded-lg border bg-background p-3 shadow-lg">
          <p className="min-w-0 flex-1 text-sm">
            {selectionLabel ? (
              <>
                <span className="font-semibold">{selectionLabel}</span>
                {comparing && <span className="ml-2 text-muted-foreground">em {selectedVersions[0]} (versão 1)</span>}
              </>
            ) : (
              <span className="text-muted-foreground">Para projetar, selecione versículos em sequência.</span>
            )}
          </p>
          <VersesPerSlideSelect value={perSlide} onChange={setPerSlide} className="h-8 w-full sm:w-60" />
          <Button type="button" variant="outline" size="sm" disabled={!selectionLabel} onClick={() => void copy()}>
            <Copy className="mr-1" /> Copiar
          </Button>
          <Button type="button" size="sm" disabled={!selectionLabel} onClick={() => project()}>
            <Projector className="mr-1" /> Projetar
          </Button>
          <Button type="button" variant="ghost" size="icon-sm" onClick={() => setSelection({ key, verses: new Set() })} aria-label="Limpar seleção">
            <X />
          </Button>
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
