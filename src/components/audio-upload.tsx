// components/audio-upload.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";

export function AudioUpload({ onUpload }: { onUpload: (file: File) => void }) {
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      toast.error("Por favor, selecione um arquivo de áudio válido");
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error("O arquivo deve ter menos de 10MB");
      return;
    }

    setIsUploading(true);
    try {
      // Aqui você faria o upload para o servidor
      // Por enquanto, apenas passa o arquivo para o componente pai
      onUpload(file);
      toast.success("Áudio carregado com sucesso!");
    } catch (error) {
      toast.error("Erro ao fazer upload do áudio");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
      <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
      <p className="text-sm text-muted-foreground mb-2">
        Arraste um arquivo de áudio ou clique para selecionar
      </p>
      <input
        type="file"
        accept="audio/*"
        onChange={handleUpload}
        disabled={isUploading}
        className="hidden"
        id="audio-upload"
      />
      <label htmlFor="audio-upload">
        <Button variant="outline" disabled={isUploading} asChild>
          <span>
            {isUploading ? "Carregando..." : "Selecionar Áudio"}
          </span>
        </Button>
      </label>
    </div>
  );
}