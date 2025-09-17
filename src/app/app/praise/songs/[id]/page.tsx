"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/trpc/react";
import { ArrowLeft, Edit, Play, Download } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { SongDetailSkeleton } from "@/components/loading-skeleton";

function LyricsFormatter({ lyrics }: { lyrics: string }) {
  const [showChords, setShowChords] = useState(true);

  if (!lyrics) return null;

  const formatLyrics = (text: string) => {
    const lines = text.split('\n');
    
    return lines.map((line, index) => {
      if (line.trim() === '') {
        return <div key={index} className="h-4" />; // Espaço vazio
      }

      if (!showChords) {
        // Modo sem acordes - remove tudo entre colchetes
        const cleanLine = line.replace(/\[.*?\]/g, '');
        return (
          <div key={index} className="lyrics-line text-base">
            {cleanLine}
          </div>
        );
      }

      const parts = line.split(/(\[.*?\])/g).filter(Boolean);
      
      return (
        <div key={index} className="lyrics-line">
          {parts.map((part, partIndex) => {
            if (part.startsWith('[') && part.endsWith(']')) {
              // É um acorde
              const chord = part.replace(/[\[\]]/g, '');
              return (
                <span
                  key={partIndex}
                  className="chord"
                  title={chord}
                >
                  {chord}
                </span>
              );
            } else {
              // É texto da letra
              return (
                <span key={partIndex} className="text-base">
                  {part}
                </span>
              );
            }
          })}
        </div>
      );
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <CardTitle className="text-lg">Letra da Música</CardTitle>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowChords(true)}
            className={`px-3 py-1 rounded text-xs transition-colors ${
              showChords 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            Com Acordes
          </button>
          <button
            onClick={() => setShowChords(false)}
            className={`px-3 py-1 rounded text-xs transition-colors ${
              !showChords 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            Sem Acordes
          </button>
        </div>
      </div>
      
      <div className="lyrics-container bg-muted p-6 rounded-lg">
        {formatLyrics(lyrics)}
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (!value) return null;
  
  return (
    <div>
      <label className="text-sm font-medium text-muted-foreground block mb-1">
        {label}
      </label>
      <p className="text-base">{value}</p>
    </div>
  );
}

import { use } from "react";

export default function SongDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Use o hook use para resolver a Promise
  const resolvedParams = use(params);
  const songId = Number(resolvedParams.id);

  const router = useRouter();
  const { data: song, isLoading } = api.song.getById.useQuery(songId);

  const handlePlayYouTube = () => {
    if (song?.youtubeUrl) {
      window.open(song.youtubeUrl, '_blank');
    } else {
      toast.error("URL do YouTube não disponível");
    }
  };

  const handleExport = () => {
    if (!song) return;

    const content = `
Título: ${song.title}
Artista: ${song.artist || 'Não informado'}
Categoria: ${getCategoryName(song.category)}
Duração: ${song.duration ? formatDuration(song.duration) : 'Não informada'}
BPM: ${song.bpm || 'Não informado'}
Tom: ${song.key || 'Não informado'}

${song.lyrics || 'Letra não disponível'}
${song.chords ? `\nCifras:\n${song.chords}` : ''}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${song.title.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Música exportada com sucesso!");
  };

  const getCategoryName = (category: string) => {
    const categories: { [key: string]: string } = {
      hymn: "Hino",
      praise: "Louvor",
      worship: "Adoração",
      chorus: "Coro",
      special: "Especial"
    };
    return categories[category] || category;
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) return <SongDetailSkeleton />;

  if (!song) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </div>
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <p className="text-lg">Música não encontrada</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => router.push('/praise/songs')}
              >
                Voltar para a lista
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {song.title}
            </h1>
            {song.artist && (
              <p className="text-muted-foreground mt-1">por {song.artist}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          {song.youtubeUrl && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handlePlayYouTube}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              <span className="hidden sm:inline">Ouvir</span>
            </Button>
          )}
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleExport}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Exportar</span>
          </Button>
          
          <Button 
            size="sm"
            onClick={() => router.push(`/praise/songs/${songId}/edit`)}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            <span className="hidden sm:inline">Editar</span>
          </Button>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="grid gap-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Informações da Música</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <InfoItem label="Artista" value={song.artist} />
              <InfoItem label="Categoria" value={getCategoryName(song.category)} />
              <InfoItem 
                label="Duração" 
                value={song.duration ? formatDuration(song.duration) : undefined} 
              />
              <InfoItem label="BPM" value={song.bpm} />
              <InfoItem label="Tom" value={song.key} />
              
              {song.youtubeUrl && (
                <div className="md:col-span-2 lg:col-span-3">
                  <label className="text-sm font-medium text-muted-foreground block mb-1">
                    YouTube
                  </label>
                  <a 
                    href={song.youtubeUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline break-words inline-flex items-center gap-1"
                  >
                    <Play className="h-3 w-3" />
                    Assistir no YouTube
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Letra */}
        {song.lyrics && (
          <Card>
            <CardContent className="pt-6">
              <LyricsFormatter lyrics={song.lyrics} />
            </CardContent>
          </Card>
        )}

        {/* Cifras */}
        {song.chords && (
          <Card>
            <CardHeader>
              <CardTitle>Cifras</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-lg">
                <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
                  {song.chords}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}