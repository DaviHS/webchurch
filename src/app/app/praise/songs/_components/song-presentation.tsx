"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Maximize, X } from "lucide-react";

export function SongPresentation({ song, onClose }: { song: any; onClose: () => void }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [fontSize, setFontSize] = useState(28);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);

  const prepareSlides = () => {
    if (!song?.lyrics) return [];

    const slides = [];
    slides.push(`Título: ${song.title}\n\nArtista: ${song.artist || "Não informado"}`);

    const verses = song.lyrics
      .split("\n\n")
      .filter((verse: string) => verse.trim() !== "");
    slides.push(...verses);

    return slides;
  };

  const slides = prepareSlides();

  useEffect(() => {
    const handleResize = () => {
      setFontSize(window.innerWidth < 640 ? 24 : 36);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0]!.clientX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const diff = e.changedTouches[0]!.clientX - touchStartX.current;
      if (diff > 50) {
        setCurrentSlide((prev) => Math.max(0, prev - 1));
      } else if (diff < -50) {
        setCurrentSlide((prev) => Math.min(slides.length - 1, prev + 1));
      }
    };

    container.addEventListener("touchstart", handleTouchStart);
    container.addEventListener("touchend", handleTouchEnd);

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [slides.length]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black z-50 flex flex-col"
    >
      {/* Header */}
      <div className="bg-gray-900 text-white p-3 flex justify-between items-center">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold truncate">{song.title}</h2>
          <p className="text-xs text-gray-300 truncate">
            {song.artist || "Artista não informado"}
          </p>
        </div>
        <div className="flex items-center space-x-2 ml-2">
          <span className="text-xs hidden sm:block">
            Slide {currentSlide + 1} de {slides.length}
          </span>
          <Button
            onClick={toggleFullscreen}
            className="bg-transparent hover:bg-gray-700 text-white p-2"
            size="sm"
          >
            <Maximize className="h-4 w-4" />
          </Button>
          <Button
            onClick={onClose}
            className="bg-transparent hover:bg-red-700 text-white p-2"
            size="sm"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Conteúdo */}
      <div
        className="flex-1 flex items-center justify-center p-4 select-none"
        style={{ backgroundColor: "#1e3a8a" }}
      >
        <div className="text-center w-full max-w-4xl px-2">
          {slides.length > 0 ? (
            <div
              className="whitespace-pre-wrap font-sans leading-relaxed"
              style={{
                color: "#ffffff",
                fontSize: `${fontSize}px`,
                lineHeight: "1.4",
                textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
              }}
            >
              {currentSlide === 0 ? (
                <div className="flex flex-col justify-center h-full">
                  <h1
                    className="font-bold mb-4"
                    style={{ fontSize: `${fontSize * 1.1}px` }}
                  >
                    {song.title}
                  </h1>
                  <p style={{ fontSize: `${fontSize * 0.7}px` }}>
                    {song.artist || "Artista não informado"}
                  </p>
                </div>
              ) : (
                slides[currentSlide]
              )}
            </div>
          ) : (
            <p style={{ color: "#ffffff", fontSize: `${fontSize}px` }}>
              Letra não disponível
            </p>
          )}
        </div>
      </div>

      {/* Controles */}
      <div className="bg-gray-900 p-3 flex justify-between items-center">
        <Button
          onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
          disabled={currentSlide === 0}
          className="bg-transparent hover:bg-gray-700 text-white p-2"
          size="sm"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex space-x-1 mx-2">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`h-1 w-4 rounded-full ${
                currentSlide === index ? "bg-white" : "bg-gray-500"
              }`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>

        <Button
          onClick={() =>
            setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))
          }
          disabled={currentSlide === slides.length - 1}
          className="bg-transparent hover:bg-gray-700 text-white p-2"
          size="sm"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
