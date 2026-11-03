"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { toast } from "sonner";

export function AudioUpload({ onUpload }: { onUpload: (file: File) => void }) {
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      toast.error("Selecione um arquivo de áudio válido");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("O arquivo deve ter no máximo 10 MB");
      return;
    }

    setIsUploading(true);
    try {
      onUpload(file);
      toast.success("Áudio carregado com sucesso!");
    } catch {
      toast.error("Erro ao carregar o áudio");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 text-center">
      <Upload className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
      <p className="mb-2 text-sm text-muted-foreground">
        Clique para selecionar um arquivo de áudio (até 10 MB)
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        onChange={handleUpload}
        disabled={isUploading}
        className="hidden"
        id="audio-upload"
      />
      <Button
        type="button"
        variant="outline"
        disabled={isUploading}
        onClick={() => inputRef.current?.click()}
      >
        {isUploading ? "Carregando..." : "Selecionar áudio"}
      </Button>
    </div>
  );
}
