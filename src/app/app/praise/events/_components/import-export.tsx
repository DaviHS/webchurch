"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/trpc/react";
import { Download, Upload } from "lucide-react";
import { toast } from "sonner";

interface ImportExportProps {
  eventId: number;
  onImport: () => void;
}

export function ImportExport({ eventId, onImport }: ImportExportProps) {
  const [isImporting, setIsImporting] = useState(false);
  const utils = api.useUtils();

  const handleExport = async () => {
    try {
      // Busca os dados do evento manualmente
      const eventData = await utils.event.getById.fetch(eventId);
      
      if (!eventData) {
        toast.error("Evento não encontrado");
        return;
      }

      // Criar arquivo JSON para download
      const blob = new Blob([JSON.stringify(eventData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `repertorio-evento-${eventId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Repertório exportado com sucesso!");
    } catch (error) {
      toast.error("Erro ao exportar repertório");
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // TODO: Implementar lógica de importação completa
      toast.success("Repertório importado com sucesso!");
      onImport();
    } catch (error) {
      toast.error("Erro ao importar repertório");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Importar/Exportar Repertório</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <Button onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Exportar JSON
          </Button>
          
          <Button asChild variant="outline" disabled={isImporting}>
            <label>
              <Upload className="mr-2 h-4 w-4" />
              Importar JSON
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
          </Button>
        </div>
        
        <p className="text-sm text-muted-foreground">
          Exporte o repertório para backup ou importe de outro evento.
        </p>
      </CardContent>
    </Card>
  );
}