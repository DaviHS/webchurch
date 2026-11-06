"use client";

import { useState } from "react";
import { ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { BIBLE_BOOKS, getBook, type BibleBookInfo } from "@/lib/bible";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";

interface Location {
  bookId: number;
  chapter: number;
}

interface PassagePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  current: Location;
  /** Versão usada só para saber quantos versículos o capítulo tem. */
  version: string | undefined;
  onPick: (location: Location, verse: number | null) => void;
}

type Step = "book" | "chapter" | "verse";

const numberButton = (active: boolean) =>
  cn(
    "flex h-10 items-center justify-center rounded-md border text-sm font-medium transition-colors hover:bg-accent",
    active && "border-primary bg-primary/10 text-primary",
  );

function VerseGrid({
  version,
  location,
  onPick,
}: {
  version: string | undefined;
  location: Location;
  onPick: (verse: number | null) => void;
}) {
  const { data, isPending, error } = api.bible.getChapter.useQuery(
    { version: version ?? "", ...location },
    { enabled: !!version, staleTime: Infinity, networkMode: "always", refetchOnWindowFocus: false },
  );

  return (
    <div className="space-y-3">
      <Button type="button" className="w-full" onClick={() => onPick(null)}>
        Ir para o capítulo
      </Button>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ou escolha um versículo</p>
      {isPending && !error && (
        <div className="flex justify-center py-6">
          <Loader2 className="size-5 animate-spin text-primary" />
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error.message}</p>}
      {data && (
        <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
          {data.verses.map((v) => (
            <button key={v.verse} type="button" className={numberButton(false)} onClick={() => onPick(v.verse)}>
              {v.verse}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PickerBody({ current, version, onPick }: Omit<PassagePickerDialogProps, "open" | "onOpenChange">) {
  const [step, setStep] = useState<Step>("book");
  const [book, setBook] = useState<BibleBookInfo | undefined>(getBook(current.bookId));
  const [chapter, setChapter] = useState<number>(current.chapter);
  const [testament, setTestament] = useState<"AT" | "NT">(getBook(current.bookId)?.testament ?? "AT");

  return (
    <ResponsiveDialogBody className="space-y-4 pb-6">
      <nav aria-label="Etapas" className="flex flex-wrap items-center gap-1 text-sm">
        <button
          type="button"
          className={cn("rounded px-1.5 py-0.5", step === "book" ? "font-semibold" : "text-primary hover:underline")}
          onClick={() => setStep("book")}
        >
          Livros
        </button>
        {step !== "book" && book && (
          <>
            <ChevronRight className="size-3.5 text-muted-foreground" />
            <button
              type="button"
              className={cn("rounded px-1.5 py-0.5", step === "chapter" ? "font-semibold" : "text-primary hover:underline")}
              onClick={() => setStep("chapter")}
            >
              {book.namePt}
            </button>
          </>
        )}
        {step === "verse" && (
          <>
            <ChevronRight className="size-3.5 text-muted-foreground" />
            <span className="rounded px-1.5 py-0.5 font-semibold">Capítulo {chapter}</span>
          </>
        )}
      </nav>

      {step === "book" && (
        <Tabs value={testament} onValueChange={(value) => setTestament(value === "NT" ? "NT" : "AT")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="AT">Antigo Testamento</TabsTrigger>
            <TabsTrigger value="NT">Novo Testamento</TabsTrigger>
          </TabsList>
          {(["AT", "NT"] as const).map((value) => (
            <TabsContent key={value} value={value} className="mt-3">
              <div className="grid grid-cols-2 gap-2">
                {BIBLE_BOOKS.filter((b) => b.testament === value).map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    className={cn(numberButton(b.id === current.bookId), "justify-start px-3 text-left")}
                    onClick={() => {
                      setBook(b);
                      setChapter(b.id === current.bookId ? current.chapter : 1);
                      setStep("chapter");
                    }}
                  >
                    <span className="truncate">{b.namePt}</span>
                  </button>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}

      {step === "chapter" && book && (
        <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
          {Array.from({ length: book.chapters }, (_, i) => i + 1).map((number) => (
            <button
              key={number}
              type="button"
              className={numberButton(book.id === current.bookId && number === current.chapter)}
              onClick={() => {
                setChapter(number);
                setStep("verse");
              }}
            >
              {number}
            </button>
          ))}
        </div>
      )}

      {step === "verse" && book && (
        <VerseGrid
          version={version}
          location={{ bookId: book.id, chapter }}
          onPick={(verse) => onPick({ bookId: book.id, chapter }, verse)}
        />
      )}
    </ResponsiveDialogBody>
  );
}

export function PassagePickerDialog({ open, onOpenChange, current, version, onPick }: PassagePickerDialogProps) {
  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent size="md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Ir para</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>Escolha o livro, o capítulo e, se quiser, o versículo.</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        {open && <PickerBody current={current} version={version} onPick={onPick} />}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
