"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X, Monitor, MonitorUp, Settings, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PresentationSong } from "./types";

const STORAGE_KEY = "presentation-screen-assignments";
const SCREENS_STORAGE_KEY = "presentation-screens-info";

interface ScreenAssignment {
  screenId: string;
  role: "main" | "stage";
}

function getStoredScreens(): any[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(SCREENS_STORAGE_KEY);
    if (!saved) return [];
    return JSON.parse(saved);
  } catch {
    return [];
  }
}

function saveScreens(screens: any[]) {
  localStorage.setItem(SCREENS_STORAGE_KEY, JSON.stringify(screens));
  window.dispatchEvent(new Event("screens-detected"));
}

function getStoredAssignments(): ScreenAssignment[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveAssignments(assignments: ScreenAssignment[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments));
}

function getScreenPosition(screenId: string): { left: number; top: number; width: number; height: number } | null {
  const screens = getStoredScreens();
  const screen = screens.find((s: any) => s.id === screenId);
  if (screen) {
    return { left: screen.left, top: screen.top, width: screen.width, height: screen.height };
  }
  return null;
}

interface PresentationManagerProps {
  song: PresentationSong;
  onClose: () => void;
}

export function PresentationManager({ song, onClose }: PresentationManagerProps) {
  const [slides, setSlides] = useState<string[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isBlackScreen, setIsBlackScreen] = useState(false);
  const [windowsOpened, setWindowsOpened] = useState(false);
  const [connected, setConnected] = useState(0);
  const [showConfig, setShowConfig] = useState(false);
  const [assignments, setAssignments] = useState<ScreenAssignment[]>([]);
  const [screensInfo, setScreensInfo] = useState<any[]>([]);

  const channelRef = useRef<BroadcastChannel | null>(null);
  const mainWindowRef = useRef<Window | null>(null);
  const stageWindowRef = useRef<Window | null>(null);
  const channelId = useRef(`pres-${Date.now()}`);

  const refreshScreenData = useCallback(() => {
    const stored = getStoredScreens();

    if (stored.length === 0) {
      const w = window.screen.width;
      const h = window.screen.height;
      const defaultScreen = {
        id: "screen-0",
        label: "Tela do Notebook",
        left: 0,
        top: 0,
        width: w,
        height: h,
        isPrimary: true,
        isInternal: true,
      };
      saveScreens([defaultScreen]);
      setScreensInfo([defaultScreen]);
    } else {
      setScreensInfo(stored);
    }

    setAssignments(getStoredAssignments());
  }, []);

  useEffect(() => {
    refreshScreenData();

    const handleScreensDetected = () => {
      refreshScreenData();
    };

    window.addEventListener("screens-detected", handleScreensDetected);
    return () => window.removeEventListener("screens-detected", handleScreensDetected);
  }, [refreshScreenData]);

  useEffect(() => {
    if (!song?.lyrics) return;

    const preparedSlides: string[] = [];
    preparedSlides.push(`${song.title}\n${song.artist || ""}`);

    const verses = song.lyrics
      .split("\n\n")
      .filter((verse: string) => verse.trim() !== "");

    preparedSlides.push(...verses);
    setSlides(preparedSlides);
    setCurrentSlide(0);
  }, [song]);

  const sendSlide = useCallback((slideIndex: number, black: boolean) => {
    if (!channelRef.current) return;

    const text = slides[slideIndex] || "";

    const nextIndex = slideIndex + 1;
    const nextText = nextIndex < slides.length
      ? slides[nextIndex]!.split("\n").slice(0, 2).join("\n")
      : "";

    channelRef.current.postMessage({
      type: "SLIDE",
      text,
      nextText,
      isBlack: black,
      slideInfo: `${slideIndex + 1}/${slides.length}`,
      songTitle: song.title,
    });
  }, [slides, song]);

  const openWindowOnScreen = useCallback((screenId: string, url: string, windowName: string) => {
    const pos = getScreenPosition(screenId);
    if (!pos) {
      const win = window.open(
        url,
        windowName,
        `width=${window.screen.width},height=${window.screen.height},menubar=no,toolbar=no,location=no,status=no`
      );
      if (win) {
        setTimeout(() => {
          win.focus();
          try { win.document.documentElement.requestFullscreen(); } catch (e) {}
        }, 800);
      }
      return win;
    }

    const features = [
      `left=${pos.left}`,
      `top=${pos.top}`,
      `width=${pos.width}`,
      `height=${pos.height}`,
      "menubar=no",
      "toolbar=no",
      "location=no",
      "status=no",
    ].join(",");

    const win = window.open(url, windowName, features);

    if (win) {
      setTimeout(() => {
        win.focus();
        try { win.document.documentElement.requestFullscreen(); } catch (e) {}
      }, 500);

      setTimeout(() => {
        try { win.document.documentElement.requestFullscreen(); } catch (e) {}
      }, 1500);
    }

    return win;
  }, []);

  const openWindows = useCallback(() => {
    const name = channelId.current;

    const channel = new BroadcastChannel(name);
    channelRef.current = channel;

    channel.onmessage = (event) => {
      if (event.data.type === "READY") {
        setConnected(prev => {
          const newVal = prev + 1;
          const currentAssignments = getStoredAssignments();
          const totalWindows = (currentAssignments.find(a => a.role === "main") ? 1 : 0) +
                              (currentAssignments.find(a => a.role === "stage") ? 1 : 0);

          if (newVal >= totalWindows && slides.length > 0) {
            setTimeout(() => sendSlide(0, false), 300);
          }
          return newVal;
        });
      }
    };

    const currentAssignments = getStoredAssignments();
    const mainAssignment = currentAssignments.find(a => a.role === "main");
    const stageAssignment = currentAssignments.find(a => a.role === "stage");

    let windowsOpenedCount = 0;

    if (mainAssignment) {
      windowsOpenedCount++;
      mainWindowRef.current = openWindowOnScreen(
        mainAssignment.screenId,
        `/presentation/main?channel=${name}`,
        "main-display"
      );
    }

    if (stageAssignment) {
      windowsOpenedCount++;
      setTimeout(() => {
        stageWindowRef.current = openWindowOnScreen(
          stageAssignment.screenId,
          `/presentation/stage?channel=${name}`,
          "stage-display"
        );
      }, 500);
    }

    if (windowsOpenedCount === 0) {
      windowsOpenedCount = 2;

      mainWindowRef.current = window.open(
        `/presentation/main?channel=${name}`,
        "main-display",
        `width=${window.screen.width},height=${window.screen.height},menubar=no,toolbar=no,location=no,status=no`
      );
      if (mainWindowRef.current) {
        setTimeout(() => {
          try { mainWindowRef.current!.document.documentElement.requestFullscreen(); } catch (e) {}
        }, 1000);
      }

      setTimeout(() => {
        stageWindowRef.current = window.open(
          `/presentation/stage?channel=${name}`,
          "stage-display",
          `width=${window.screen.width},height=${window.screen.height},menubar=no,toolbar=no,location=no,status=no`
        );
        if (stageWindowRef.current) {
          setTimeout(() => {
            try { stageWindowRef.current!.document.documentElement.requestFullscreen(); } catch (e) {}
          }, 1500);
        }
      }, 500);
    }

    setWindowsOpened(true);
  }, [slides, sendSlide, openWindowOnScreen]);

  const closeAll = useCallback(() => {
    try {
      channelRef.current?.postMessage({ type: "CLOSE" });
      if (mainWindowRef.current) {
        try { mainWindowRef.current.document.exitFullscreen(); } catch (e) {}
      }
      if (stageWindowRef.current) {
        try { stageWindowRef.current.document.exitFullscreen(); } catch (e) {}
      }
    } catch (e) {}

    setTimeout(() => {
      try { mainWindowRef.current?.close(); } catch (e) {}
      try { stageWindowRef.current?.close(); } catch (e) {}
      try { channelRef.current?.close(); } catch (e) {}
    }, 300);

    setTimeout(onClose, 500);
  }, [onClose]);

  const goTo = useCallback((dir: number) => {
    const newSlide = Math.max(0, Math.min(slides.length - 1, currentSlide + dir));
    setCurrentSlide(newSlide);
    sendSlide(newSlide, isBlackScreen);
  }, [currentSlide, slides.length, isBlackScreen, sendSlide]);

  const toggleBlack = useCallback(() => {
    const newBlack = !isBlackScreen;
    setIsBlackScreen(newBlack);
    sendSlide(currentSlide, newBlack);
  }, [currentSlide, isBlackScreen, sendSlide]);

  const toggleAssignment = (screenId: string, role: "main" | "stage") => {
    const current = getStoredAssignments();
    const existing = current.find(a => a.screenId === screenId);

    let updated: ScreenAssignment[];

    if (existing?.role === role) {
      updated = current.filter(a => a.screenId !== screenId);
    } else {
      updated = current.filter(a => a.role !== role && a.screenId !== screenId);
      updated.push({ screenId, role });
    }

    saveAssignments(updated);
    setAssignments(updated);
  };

  const handleAddManualScreen = () => {
    const currentScreens = getStoredScreens();
    const manualCount = currentScreens.filter((s: any) => s.id && s.id.startsWith("screen-manual")).length;
    const newId = `screen-manual-${Date.now()}`;

    currentScreens.push({
      id: newId,
      label: manualCount === 0 ? "Monitor HDMI" : `Monitor HDMI ${manualCount + 1}`,
      left: window.screen.width,
      top: 0,
      width: 1920,
      height: 1080,
      isPrimary: false,
      isInternal: false,
    });

    saveScreens(currentScreens);
    setScreensInfo(currentScreens);
  };

  const handleRemoveManualScreen = (screenId: string) => {
    const currentScreens = getStoredScreens();
    const filtered = currentScreens.filter((s: any) => s.id !== screenId);

    const currentAssignments = getStoredAssignments();
    const newAssignments = currentAssignments.filter(a => a.screenId !== screenId);
    saveAssignments(newAssignments);
    setAssignments(newAssignments);

    saveScreens(filtered);
    setScreensInfo(filtered);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === "ArrowLeft") { e.preventDefault(); goTo(-1); }
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); goTo(1); }
      if (e.key === "Escape") { e.preventDefault(); closeAll(); }
      if (e.key === "b" || e.key === "B") { e.preventDefault(); toggleBlack(); }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goTo, toggleBlack, closeAll]);

  useEffect(() => {
    return () => {
      try { channelRef.current?.postMessage({ type: "CLOSE" }); channelRef.current?.close(); } catch (e) {}
      try { mainWindowRef.current?.close(); } catch (e) {}
      try { stageWindowRef.current?.close(); } catch (e) {}
    };
  }, []);

  if (showConfig) {
    const currentAssignments = getStoredAssignments();
    const mainAssigned = currentAssignments.find(a => a.role === "main");
    const stageAssigned = currentAssignments.find(a => a.role === "stage");

    return (
      <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center">
        <div className="bg-gray-900 text-white rounded-lg w-[700px] max-w-[95vw] max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-700 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-400" />
                Gerenciar Telas
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                {screensInfo.length} tela(s) configurada(s)
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowConfig(false)} className="text-gray-400 hover:text-white">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="p-6 space-y-4">
            {screensInfo.length === 0 ? (
              <div className="text-center py-8">
                <Monitor className="h-12 w-12 mx-auto mb-3 text-gray-600" />
                <p className="text-gray-400">Nenhuma tela configurada</p>
              </div>
            ) : (
              <>
                <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-3 text-sm text-blue-300">
                  As configurações ficam salvas no navegador. Configure uma vez e use sempre.
                </div>

                <div className="space-y-3">
                  {screensInfo.map((screen: any) => {
                    const assignment = currentAssignments.find(a => a.screenId === screen.id);
                    const role = assignment?.role || "available";
                    const isManual = screen.id && screen.id.startsWith("screen-manual");

                    return (
                      <div
                        key={screen.id}
                        className={`bg-gray-800 border rounded-lg p-4 transition-colors ${
                          role === "main" ? "border-blue-500 bg-blue-900/20" :
                          role === "stage" ? "border-green-500 bg-green-900/20" :
                          "border-gray-700"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm text-gray-200">{screen.label}</p>
                              {isManual && (
                                <button
                                  onClick={() => handleRemoveManualScreen(screen.id)}
                                  className="text-red-400 hover:text-red-300 text-xs"
                                  title="Remover tela"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                            <p className="text-xs text-gray-400">
                              {screen.width} × {screen.height}px
                              {screen.isInternal ? " • Notebook" : " • Externo"}
                              {screen.isPrimary ? " • Principal" : ""}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Button
                              size="sm"
                              variant={role === "main" ? "default" : "outline"}
                              className={`h-8 text-xs transition-colors ${
                                role === "main" 
                                  ? "bg-blue-600 hover:bg-blue-700 text-white" 
                                  : "border-gray-600 text-blue-400 hover:text-blue-700 hover:border-gray-500"
                              }`}
                              onClick={() => toggleAssignment(screen.id, "main")}
                            >
                              <Monitor className="h-3 w-3 mr-1" />
                              Telão
                            </Button>
                            <Button
                              size="sm"
                              variant={role === "stage" ? "default" : "outline"}
                              className={`h-8 text-xs transition-colors ${
                                role === "stage" 
                                  ? "bg-green-600 hover:bg-green-700 text-white" 
                                  : "border-gray-600 text-green-400 hover:text-green-700 hover:border-gray-500"
                              }`}
                              onClick={() => toggleAssignment(screen.id, "stage")}
                            >
                              <MonitorUp className="h-3 w-3 mr-1" />
                              Púlpito
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-3">
                    <p className="text-xs text-blue-400 mb-1">Telão</p>
                    <p className="text-sm text-gray-200">
                      {mainAssigned
                        ? screensInfo.find((s: any) => s.id === mainAssigned.screenId)?.label || "Configurado"
                        : "Não definido"}
                    </p>
                  </div>
                  <div className="bg-green-900/30 border border-green-700 rounded-lg p-3">
                    <p className="text-xs text-green-400 mb-1">Púlpito</p>
                    <p className="text-sm text-gray-200">
                      {stageAssigned
                        ? screensInfo.find((s: any) => s.id === stageAssigned.screenId)?.label || "Configurado"
                        : "Não definido"}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-700">
                  <p className="text-sm text-gray-400 mb-3">
                    Adicionar monitor externo:
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddManualScreen}
                    className="w-full border-gray-600 text-black hover:text-white hover:border-gray-500"
                  >
                    <Plus className="h-4 w-4 mr-2 text-black" />
                    Adicionar HDMI (1920×1080)
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">
                    Depois de adicionar, atribua como Telão ou Púlpito clicando nos botões ao lado.
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="p-4 border-t border-gray-700 flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => setShowConfig(false)} 
              className="flex-1 border-gray-600 text-blue-700 hover:text-blue-400 hover:border-gray-500"
            >
              Concluído
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!windowsOpened) {
    const mainAssigned = assignments.find(a => a.role === "main");
    const stageAssigned = assignments.find(a => a.role === "stage");

    return (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
        <div className="bg-gray-900 text-white rounded-lg p-8 max-w-md w-full mx-4 text-center">
          <Monitor className="h-16 w-16 mx-auto mb-4 text-blue-400" />
          <h2 className="text-xl font-bold mb-2">Iniciar Apresentação</h2>
          <p className="text-gray-400 mb-4 text-sm">
            {mainAssigned && stageAssigned
              ? "Telas configuradas! As janelas abrirão nos monitores corretos."
              : mainAssigned || stageAssigned
              ? "Uma tela configurada. Apenas ela será aberta."
              : "Nenhuma tela configurada. As janelas abrirão no monitor atual."}
          </p>

          <div className="bg-gray-800 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">Telão:</span>
              {mainAssigned ? (
                <span className="text-xs text-blue-400">
                  {screensInfo.find((s: any) => s.id === mainAssigned.screenId)?.label || "Configurado"} ✓
                </span>
              ) : (
                <span className="text-xs text-gray-500">Não será aberto</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Púlpito:</span>
              {stageAssigned ? (
                <span className="text-xs text-green-400">
                  {screensInfo.find((s: any) => s.id === stageAssigned.screenId)?.label || "Configurado"} ✓
                </span>
              ) : (
                <span className="text-xs text-gray-500">Não será aberto</span>
              )}
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowConfig(true)}
            className="mb-4 text-xs text-gray-400 hover:text-white w-full hover:bg-green-700"
          >
            <Settings className="h-3 w-3 mr-1" />
            Gerenciar Telas
          </Button>

          <p className="text-yellow-400 text-xs mb-4">
            Permitir pop-ups e tela cheia neste site
          </p>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={onClose} 
              className="flex-1 text-black hover:text-red-500 hover:border-red-500"
            >
              Cancelar
            </Button>
            <Button onClick={openWindows} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
              Abrir Telas
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentText = slides[currentSlide] || "";
  const nextIndex = currentSlide + 1;
  const nextPreview = nextIndex < slides.length
    ? slides[nextIndex]!.split("\n").slice(0, 2).join("\n")
    : "";

  const totalExpected = (assignments.find(a => a.role === "main") ? 1 : 0) + 
                        (assignments.find(a => a.role === "stage") ? 1 : 0) || 2;

  return (
    <div className="fixed inset-0 bg-gray-900 text-white z-50 flex flex-col">
      <div className="bg-gray-800 p-2 flex justify-between items-center flex-shrink-0">
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold truncate">{song.title}</h2>
          <p className="text-xs text-gray-400 truncate">
            {song.artist} {connected < totalExpected && `(conectando ${connected}/${totalExpected}...)`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs">Slide {currentSlide + 1}/{slides.length}</span>
          <Button variant="outline" size="sm" onClick={toggleBlack} className={`h-7 text-xs ${isBlackScreen ? "bg-red-600 text-white border-red-600" : "bg-gray-700 text-gray-300 border-gray-600 hover:text-white"}`}>
            {isBlackScreen ? "Tela Preta ON" : "Tela Preta"}
          </Button>
          <Button variant="outline" size="sm" onClick={closeAll} className="h-7 text-xs bg-gray-700 text-gray-300 border-gray-600 hover:text-white">
            <X className="h-3 w-3 mr-1" /> Fechar
          </Button>
        </div>
      </div>

      <div className="flex-1 flex gap-3 p-3 min-h-0">
        <div className="flex-1 bg-gray-800 rounded-lg p-3 flex flex-col min-w-0">
          <h3 className="text-xs font-semibold mb-2 text-gray-400 uppercase">Preview - Tela Principal</h3>
          <div className="flex-1 rounded flex items-center justify-center p-4" style={{ backgroundColor: isBlackScreen ? "#000" : "#1e3a8a" }}>
            {!isBlackScreen && (
              <pre className="whitespace-pre-wrap text-center font-sans leading-relaxed text-base text-white">{currentText}</pre>
            )}
          </div>
        </div>

        <div className="w-80 bg-gray-800 rounded-lg p-3 flex flex-col flex-shrink-0">
          <h3 className="text-xs font-semibold mb-2 text-gray-400 uppercase">Próximo Slide</h3>
          <div className="flex-1 bg-gray-700 rounded p-3 flex items-center justify-center">
            {isBlackScreen ? (
              <p className="text-gray-500 text-sm">Tela preta ativada</p>
            ) : nextPreview ? (
              <pre className="whitespace-pre-wrap text-center font-sans leading-relaxed text-sm text-gray-300">{nextPreview}</pre>
            ) : (
              <p className="text-gray-500 text-sm">Último slide</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-gray-800 p-3 flex justify-center gap-4 flex-shrink-0">
        <Button onClick={() => goTo(-1)} disabled={currentSlide === 0} className="h-12 px-6 text-base bg-gray-700 hover:bg-gray-600 text-white">
          ⬅ Anterior
        </Button>
        <Button onClick={() => goTo(1)} disabled={currentSlide === slides.length - 1} className="h-12 px-6 text-base bg-blue-600 hover:bg-blue-700 text-white">
          Próximo ➡
        </Button>
      </div>
    </div>
  );
}