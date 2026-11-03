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

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted, audioUrl]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => setError("Erro ao reproduzir áudio"));
    }
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
                onClick={() => window.open(youtubeUrl, "_blank", "noopener,noreferrer")}
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
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onError={() => setError("Erro ao carregar áudio")}
      />

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
            aria-label="Baixar"
            title="Baixar"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
          </Button>
        )}
      </div>

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

      <div className="flex items-center justify-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={skipBackward}
          aria-label="Voltar 10 segundos"
          disabled={!audioUrl}
        >
          <SkipBack className="h-5 w-5" />
        </Button>

        <Button
          size="icon"
          onClick={togglePlay}
          aria-label={isPlaying ? "Pausar" : "Reproduzir"}
          disabled={!audioUrl || !!error}
          className="h-12 w-12 rounded-full"
        >
          {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={skipForward}
          aria-label="Avançar 10 segundos"
          disabled={!audioUrl}
        >
          <SkipForward className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMute}
          aria-label={isMuted || volume === 0 ? "Ativar som" : "Silenciar"}
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

      {error && (
        <div role="alert" className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {youtubeUrl && !audioUrl && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => window.open(youtubeUrl, "_blank", "noopener,noreferrer")}
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