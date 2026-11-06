"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { MAX_NOTE_LENGTH } from "@/lib/bible-marks";

interface VerseNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reference: string;
  verseText?: string;
  initialNote: string;
  isSaving: boolean;
  onSave: (note: string) => void;
}

function NoteForm({
  verseText,
  initialNote,
  isSaving,
  onSave,
  onCancel,
}: Pick<VerseNoteDialogProps, "verseText" | "initialNote" | "isSaving" | "onSave"> & { onCancel: () => void }) {
  const [note, setNote] = useState(initialNote);
  const trimmed = note.trim();

  return (
    <>
      <ResponsiveDialogBody className="space-y-3 pb-4">
        {verseText && <p className="rounded-md bg-muted/50 p-3 text-sm italic text-muted-foreground">{verseText}</p>}
        <Textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Escreva sua anotação sobre este versículo"
          rows={6}
          maxLength={MAX_NOTE_LENGTH}
          aria-label="Anotação"
          autoFocus
        />
        <p className="text-right text-xs text-muted-foreground">
          {note.length}/{MAX_NOTE_LENGTH}
        </p>
      </ResponsiveDialogBody>
      <ResponsiveDialogFooter>
        {initialNote && (
          <Button type="button" variant="outline" className="text-destructive sm:mr-auto" disabled={isSaving} onClick={() => onSave("")}>
            Excluir anotação
          </Button>
        )}
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancelar
        </Button>
        <Button type="button" onClick={() => onSave(trimmed)} disabled={isSaving || trimmed === initialNote.trim()}>
          {isSaving ? "Salvando..." : "Salvar"}
        </Button>
      </ResponsiveDialogFooter>
    </>
  );
}

export function VerseNoteDialog({ open, onOpenChange, reference, verseText, initialNote, isSaving, onSave }: VerseNoteDialogProps) {
  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent size="md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Anotação · {reference}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>Só você vê esta anotação.</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        {open && (
          <NoteForm
            key={reference}
            verseText={verseText}
            initialNote={initialNote}
            isSaving={isSaving}
            onSave={onSave}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
