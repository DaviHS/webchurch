"use client";

import { ErrorDisplay } from "@/components/ui/error-display";
import { useState } from "react";
import Link from "next/link";
import { Bookmark, BookOpenCheck, ChevronLeft, StickyNote, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageContainer, PageHeader } from "@/components/page-header";
import { PaginationBar } from "@/components/pagination-bar";
import { BIBLE_MARK_COLORS, markColor, type BibleMarkColor } from "@/lib/bible-marks";
import { formatChapterTitle, getBook } from "@/lib/bible";
import { formatDateTime } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";

const PAGE_SIZE = 20;

export default function MyMarksPage() {
  const [page, setPage] = useState(1);
  const [color, setColor] = useState<BibleMarkColor | undefined>(undefined);
  const [onlyNotes, setOnlyNotes] = useState(false);

  const { data, isLoading, error, refetch } = api.bible.myMarks.useQuery(
    { page, limit: PAGE_SIZE, color, onlyNotes },
    { placeholderData: (previous) => previous },
  );

  const pickColor = (next: BibleMarkColor | undefined) => {
    setColor(next);
    setPage(1);
  };

  return (
    <PageContainer>
      <PageHeader
        title="Minhas marcações"
        icon={Bookmark}
        description="Versículos que você marcou ou anotou. Só você vê esta lista."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/app/bible/plan">
                <BookOpenCheck className="mr-1" /> Plano de leitura
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/app/bible">
                <ChevronLeft className="mr-1" /> Voltar à Bíblia
              </Link>
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2" role="group" aria-label="Filtrar por cor">
            {BIBLE_MARK_COLORS.map((option) => {
              const active = color === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={active}
                  aria-label={`Marcações ${option.label.toLowerCase()}`}
                  title={option.label}
                  onClick={() => pickColor(active ? undefined : option.value)}
                  className={cn(
                    "size-9 rounded-full border-2 border-background transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
                    option.swatch,
                    active ? "z-10 scale-110 ring-2 ring-primary" : color !== undefined && "opacity-40 hover:opacity-100",
                  )}
                />
              );
            })}
          </div>
          {color !== undefined && (
            <Button type="button" variant="ghost" size="sm" onClick={() => pickColor(undefined)}>
              <X className="mr-1" /> Limpar
            </Button>
          )}
        </div>
        <label className="flex min-h-10 items-center gap-2 text-sm">
          <Checkbox
            checked={onlyNotes}
            onCheckedChange={(checked) => {
              setOnlyNotes(checked === true);
              setPage(1);
            }}
          />
          Só com anotação
        </label>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorDisplay message={error.message} onRetry={() => void refetch()} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="Nada por aqui ainda"
          description="Na Bíblia, toque nos versículos e escolha uma cor ou toque em Anotar."
        />
      ) : (
        <>
          <div className="space-y-2">
            {data.items.map((mark) => {
              const book = getBook(mark.bookId);
              if (!book) return null;
              const swatch = markColor(mark.color);
              const query = new URLSearchParams({ b: String(mark.bookId), c: String(mark.chapter), s: String(mark.verse) });
              return (
                <Link
                  key={`${mark.bookId}:${mark.chapter}:${mark.verse}`}
                  href={`/app/bible?${query.toString()}`}
                  className="block rounded-md focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Card className="transition-colors hover:bg-accent/40">
                    <CardContent className="space-y-1.5 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                        <p className="flex items-center gap-2 font-semibold">
                          {swatch && <span className={cn("size-3 shrink-0 rounded-full border border-foreground/20", swatch.swatch)} />}
                          {formatChapterTitle(book, mark.chapter)}:{mark.verse}
                        </p>
                        <span className="text-xs text-muted-foreground">{formatDateTime(mark.updatedAt)}</span>
                      </div>
                      {mark.text && (
                        <p className={cn("rounded px-1 text-sm", swatch?.highlight)}>
                          {mark.text}
                          {data.version && <span className="ml-1 text-xs text-muted-foreground">({data.version})</span>}
                        </p>
                      )}
                      {mark.note && (
                        <p className="flex items-start gap-1.5 whitespace-pre-line text-sm text-muted-foreground">
                          <StickyNote className="mt-0.5 size-3.5 shrink-0" />
                          <span className="min-w-0 break-words">{mark.note}</span>
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
          <PaginationBar page={page} onPageChange={setPage} totalPages={data.totalPages} total={data.total} showing={data.items.length} itemLabel="marcações" />
        </>
      )}
    </PageContainer>
  );
}
