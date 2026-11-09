"use client";

import { useState } from "react";
import { Copy, Loader2, Plus, Projector, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { fontFamilyOf, READING_SIZES, useReadingPrefs } from "@/hooks/use-reading-prefs";
import { api } from "@/trpc/react";
import { VersionSelect, type VersionInfo } from "./version-select";

const MAX_COLUMNS = 3;

interface CompareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Ex.: "João 3:16-18". */
  reference: string;
  location: { bookId: number; chapter: number };
  verses: number[];
  versions: VersionInfo[];
  /** Versão aberta no leitor: é a primeira coluna. */
  baseVersion: string;
  canProject: boolean;
  onCopy: (version: string) => void;
  onProject: (version: string) => void;
}

function CompareColumn({
  version,
  versions,
  taken,
  location,
  verses,
  canProject,
  onChange,
  onRemove,
  onCopy,
  onProject,
}: {
  version: string;
  versions: VersionInfo[];
  taken: string[];
  location: CompareDialogProps["location"];
  verses: number[];
  canProject: boolean;
  onChange: (code: string) => void;
  onRemove?: () => void;
  onCopy: () => void;
  onProject: () => void;
}) {
  const [reading] = useReadingPrefs();
  const { data, isPending, error } = api.bible.getChapter.useQuery(
    { version, ...location },
    { staleTime: Infinity, networkMode: "always", refetchOnWindowFocus: false },
  );
  const wanted = new Set(verses);
  const shown = data?.verses.filter((v) => wanted.has(v.verse)) ?? [];

  return (
    <section aria-label={`Texto em ${version}`} className="min-w-0 space-y-3 rounded-md border p-3">
      <div className="flex items-center gap-1">
        <VersionSelect value={version} versions={versions} taken={taken} onChange={onChange} label="Versão" className="w-full min-w-0 flex-1" />
        {onRemove && (
          <Button type="button" variant="ghost" size="icon" onClick={onRemove} aria-label={`Remover ${version} da comparação`}>
            <X />
          </Button>
        )}
      </div>
      {isPending && (
        <div className="flex justify-center py-6">
          <Loader2 className="size-5 animate-spin text-primary" />
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error.message}</p>}
      {data && shown.length === 0 && <p className="text-sm text-muted-foreground">Sem estes versículos nesta versão.</p>}
      <div className="space-y-1.5 leading-relaxed" style={{ fontFamily: fontFamilyOf(reading.font), fontSize: READING_SIZES[reading.size] }}>
        {shown.map((v) => (
          <p key={v.verse}>
            <sup className="mr-1 text-[0.7em] font-bold text-primary">{v.verse}</sup>
            {v.text}
          </p>
        ))}
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCopy}>
          <Copy className="mr-1" /> Copiar
        </Button>
        <Button type="button" size="sm" disabled={!canProject} onClick={onProject}>
          <Projector className="mr-1" /> Projetar
        </Button>
      </div>
    </section>
  );
}

function CompareBody({ versions, baseVersion, ...props }: Omit<CompareDialogProps, "open" | "onOpenChange" | "reference">) {
  const [codes, setCodes] = useState(() => {
    const other = versions.find((v) => v.code !== baseVersion && v.language === versions.find((x) => x.code === baseVersion)?.language) ?? versions.find((v) => v.code !== baseVersion);
    return other ? [baseVersion, other.code] : [baseVersion];
  });

  const addVersion = () => {
    const candidate = versions.find((v) => !codes.includes(v.code));
    if (candidate) setCodes([...codes, candidate.code]);
  };

  return (
    <ResponsiveDialogBody className="space-y-3 pb-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {codes.map((code, index) => (
          <CompareColumn
            key={index}
            version={code}
            versions={versions}
            taken={codes}
            location={props.location}
            verses={props.verses}
            canProject={props.canProject}
            onChange={(next) => setCodes(codes.map((current, i) => (i === index ? next : current)))}
            onRemove={codes.length > 2 ? () => setCodes(codes.filter((_, i) => i !== index)) : undefined}
            onCopy={() => props.onCopy(code)}
            onProject={() => props.onProject(code)}
          />
        ))}
      </div>
      {codes.length < Math.min(MAX_COLUMNS, versions.length) && (
        <Button type="button" variant="outline" size="sm" onClick={addVersion}>
          <Plus className="mr-1" /> Adicionar versão
        </Button>
      )}
    </ResponsiveDialogBody>
  );
}

export function CompareDialog({ open, onOpenChange, reference, ...rest }: CompareDialogProps) {
  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent size="xl">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Comparar · {reference}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>Os versículos selecionados em cada versão.</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        {open && <CompareBody {...rest} />}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
