"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/data-table";
import { api } from "@/trpc/react";
import { Plus, Search, Play, X, ChevronLeft, ChevronRight, Maximize, Edit } from "lucide-react";

function SongPresentation({ song, onClose }: { song: any; onClose: () => void }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState("#1e3a8a");
  const [textColor, setTextColor] = useState("#ffffff");
  const [fontSize, setFontSize] = useState(36);

  const prepareSlides = () => {
    if (!song?.lyrics) return [];
    
    const slides = [];
    slides.push(`Título: ${song.title}\n\nArtista: ${song.artist}`);
    
    const verses = song.lyrics.split('\n\n').filter((verse: string) => verse.trim() !== '');
    slides.push(...verses);
    
    return slides;
  };

  const slides = prepareSlides();

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const touchStartX = e.touches[0]!.clientX;
      
      const handleTouchEnd = (e: TouchEvent) => {
        const touchEndX = e.changedTouches[0]!.clientX;
        const diffX = touchEndX - touchStartX;
        
        if (Math.abs(diffX) > 50) {
          if (diffX > 0) {
            handlePrevious();
          } else {
            handleNext();
          }
        }
      };
      
      document.addEventListener('touchend', handleTouchEnd, { once: true });
    };

    document.addEventListener('touchstart', handleTouchStart);
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
    };
  }, [currentSlide]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' || e.key === ' ') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'f') {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide]);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(console.error);
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(console.error);
      }
    };
  }, []);

  if (!song) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="bg-gray-900 text-white p-2 sm:p-4 flex justify-between items-center">
        <div className="hidden sm:block">
          <h2 className="text-xl font-bold">{song.title}</h2>
          <p className="text-sm">{song.artist}</p>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-4">
          <div className="hidden sm:flex items-center space-x-2">
            <span className="text-sm">Slide {currentSlide + 1} de {slides.length}</span>
            <select 
              value={backgroundColor} 
              onChange={(e) => setBackgroundColor(e.target.value)}
              className="bg-gray-800 text-white p-1 rounded text-xs"
            >
              <option value="#1e3a8a">Azul</option>
              <option value="#0f766e">Verde</option>
              <option value="#831843">Roxo</option>
              <option value="#450a0a">Vermelho</option>
              <option value="#000000">Preto</option>
            </select>
            <select 
              value={fontSize} 
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="bg-gray-800 text-white p-1 rounded text-xs"
            >
              <option value={28}>Pequeno</option>
              <option value={36}>Médio</option>
              <option value={44}>Grande</option>
              <option value={52}>Extra Grande</option>
            </select>
          </div>
          <div className="flex space-x-1 sm:space-x-2">
            <Button variant="outline" size="sm" onClick={toggleFullscreen} className="text-white p-1 sm:p-2">
              <Maximize className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={onClose} className="text-white p-1 sm:p-2">
              <X className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div 
        className="flex-1 flex items-center justify-center p-4 sm:p-8 transition-colors duration-300"
        style={{ backgroundColor }}
        onClick={handleNext}
      >
        <div className="text-center w-full max-w-4xl">
          {slides.length > 0 ? (
            <div 
              className="whitespace-pre-wrap font-sans leading-relaxed select-none"
              style={{ color: textColor, fontSize: `${fontSize}px`, lineHeight: '1.5' }}
            >
              {currentSlide === 0 ? (
                <div className="flex flex-col justify-center h-full">
                  <h1 className="font-bold mb-4" style={{ fontSize: `${fontSize * 1.2}px` }}>
                    {song.title}
                  </h1>
                  <p style={{ fontSize: `${fontSize * 0.8}px` }}>
                    {song.artist}
                  </p>
                </div>
              ) : (
                slides[currentSlide]
              )}
            </div>
          ) : (
            <p style={{ color: textColor, fontSize: `${fontSize}px` }}>Letra não disponível</p>
          )}
        </div>
      </div>

      <div className="bg-gray-900 p-2 sm:p-4 flex justify-between items-center">
        <Button 
          onClick={handlePrevious} 
          disabled={currentSlide === 0}
          className="hidden sm:flex"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Anterior
        </Button>
        
        <div className="flex space-x-1 mx-auto sm:mx-0">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`h-2 w-2 rounded-full ${currentSlide === index ? 'bg-white' : 'bg-gray-500'}`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>
        
        <Button 
          onClick={handleNext} 
          disabled={currentSlide === slides.length - 1}
          className="hidden sm:flex"
        >
          Próximo
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
        
        <div className="flex sm:hidden space-x-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handlePrevious} 
            disabled={currentSlide === 0}
            className="text-white p-2"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleNext} 
            disabled={currentSlide === slides.length - 1}
            className="text-white p-2"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function SongsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState("");
  const [presentingSong, setPresentingSong] = useState<any>(null);

  const { data, isLoading } = api.song.list.useQuery({
    search,
    category: category || undefined,
    page,
    limit: 10,
  });

  const getRowCanExpand = (row: any) => {
    return !!row.original.lyrics;
  };

  const renderSubComponent = ({ row }: { row: any }) => {
    const lyrics = row.original.lyrics || 'Letra não disponível.';
    
    return (
      <div className="p-4 bg-muted/50">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-semibold">Letra da Música</h4>
          <Button 
            onClick={() => setPresentingSong(row.original)}
            className="flex items-center"
          >
            <Play className="h-4 w-4 mr-2" />
            Apresentar
          </Button>
        </div>
        <pre className="whitespace-pre-wrap text-sm bg-white p-4 rounded-md max-h-60 overflow-y-auto">
          {lyrics}
        </pre>
      </div>
    );
  };

  const columns = [
    {
      header: "Título",
      accessorKey: "title",
    },
    {
      header: "Artista",
      accessorKey: "artist",
    },
    {
      header: "Categoria",
      accessorKey: "category",
      cell: (info: any) => {
        const categories = {
          hymn: "Hino",
          praise: "Louvor",
          worship: "Adoração",
          chorus: "Coro",
          special: "Especial"
        };
        return categories[info.getValue() as keyof typeof categories] || info.getValue();
      }
    },
    {
      header: "Duração",
      accessorKey: "duration",
      cell: (info: any) => {
        const duration = info.getValue();
        return duration ? `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}` : "-";
      }
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }: { row: any }) => {
        return (
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/app/praise/songs/${row.original.id}`)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => setPresentingSong(row.original)}
              disabled={!row.original.lyrics}
            >
              <Play className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="container mx-auto py-4">
      {presentingSong && (
        <SongPresentation 
          song={presentingSong} 
          onClose={() => setPresentingSong(null)} 
        />
      )}
      
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Músicas</h1>
        <Button onClick={() => router.push("/app/praise/songs/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Música
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative w-full sm:flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar músicas..."
                className="pl-10 w-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="border rounded-md px-3 py-2 w-full sm:w-auto"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Todas categorias</option>
              <option value="hymn">Hino</option>
              <option value="praise">Louvor</option>
              <option value="worship">Adoração</option>
              <option value="chorus">Coro</option>
              <option value="special">Especial</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={data?.songs || []}
            loading={isLoading}
            pagination={{
              currentPage: page,
              totalPages: data?.totalPages || 1,
              onPageChange: setPage,
              totalItems: data?.total || 0,
            }}
            getRowCanExpand={getRowCanExpand}
            renderSubComponent={renderSubComponent}
          />
        </CardContent>
      </Card>
    </div>
  );
}