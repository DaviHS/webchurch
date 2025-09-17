"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  SkipBack, 
  SkipForward,
  Download,
  ExternalLink
} from "lucide-react";

interface MusicPlayerProps {
  audioUrl?: string;
  youtubeUrl?: string;
  title: string;
  artist?: string;
  onDownload?: () => void;
}

export function MusicPlayer({ 
  audioUrl, 
  youtubeUrl, 
  title, 
  artist, 
  onDownload 
}: MusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // Configurar o áudio
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnd = () => setIsPlaying(false);
    const handleError = () => setError("Erro ao carregar áudio");

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnd);
    audio.addEventListener('error', handleError);

    audio.volume = isMuted ? 0 : volume;

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnd);
      audio.removeEventListener('error', handleError);
    };
  }, [volume, isMuted]);

  // Controles do player
  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(err => {
        setError("Erro ao reproduzir áudio");
        console.error("Audio play error:", err);
      });
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = value[0]!;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]!;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const skipBackward = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, audio.currentTime - 10);
  };

  const skipForward = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.min(audio.duration, audio.currentTime + 10);
  };

  // Se não há URL de áudio, mostrar botão para YouTube
  if (!audioUrl) {
    return (
      <div className="bg-muted rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold truncate">{title}</h4>
            {artist && <p className="text-sm text-muted-foreground truncate">{artist}</p>}
          </div>
          
          <div className="flex items-center gap-2">
            {youtubeUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(youtubeUrl, '_blank')}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Ouvir no YouTube
              </Button>
            )}
            
            {onDownload && (
              <Button
                variant="outline"
                size="sm"
                onClick={onDownload}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Baixar
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-muted rounded-lg p-4 space-y-4">
      {/* Áudio element (hidden) */}
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
      />

      {/* Informações da música */}
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold truncate">{title}</h4>
          {artist && <p className="text-sm text-muted-foreground truncate">{artist}</p>}
        </div>
        
        {onDownload && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDownload}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Barra de progresso */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        
        <Slider
          value={[currentTime]}
          max={duration || 100}
          step={0.1}
          onValueChange={handleSeek}
          className="w-full"
        />
      </div>

      {/* Controles principais */}
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={skipBackward}
          disabled={!audioUrl}
        >
          <SkipBack className="h-5 w-5" />
        </Button>

        <Button
          size="icon"
          onClick={togglePlay}
          disabled={!audioUrl || !!error}
          className="h-12 w-12 rounded-full"
        >
          {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={skipForward}
          disabled={!audioUrl}
        >
          <SkipForward className="h-5 w-5" />
        </Button>
      </div>

      {/* Controle de volume */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMute}
          className="h-8 w-8"
        >
          {isMuted || volume === 0 ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </Button>

        <Slider
          value={[isMuted ? 0 : volume]}
          max={1}
          step={0.01}
          onValueChange={handleVolumeChange}
          className="w-24"
        />
      </div>

      {/* Mensagem de erro */}
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
          {error}
        </div>
      )}

      {/* Fallback para YouTube */}
      {youtubeUrl && !audioUrl && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => window.open(youtubeUrl, '_blank')}
            className="flex items-center gap-2 mx-auto"
          >
            <ExternalLink className="h-4 w-4" />
            Ouvir no YouTube
          </Button>
        </div>
      )}
    </div>
  );
}