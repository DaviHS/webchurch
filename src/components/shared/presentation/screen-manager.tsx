"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Monitor, MonitorUp, MonitorPlay, Check, X, RefreshCw, 
  ExternalLink, Maximize, Laptop, Tv, Radio
} from "lucide-react";

interface ScreenInfo {
  id: string;
  label: string;
  left: number;
  top: number;
  width: number;
  height: number;
  isPrimary: boolean;
  isInternal: boolean;
  color: string;
}

type ScreenRole = "main" | "stage" | "available";

interface ScreenAssignment {
  screenId: string;
  role: ScreenRole;
}

const SCREEN_COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", 
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1"
];

const STORAGE_KEY = "presentation-screen-assignments";

export function ScreenManager() {
  const [screens, setScreens] = useState<ScreenInfo[]>([]);
  const [assignments, setAssignments] = useState<ScreenAssignment[]>([]);
  const [showManager, setShowManager] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setAssignments(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const saveAssignments = (newAssignments: ScreenAssignment[]) => {
    setAssignments(newAssignments);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newAssignments));
  };

  const detectScreens = useCallback(async () => {
    setDetecting(true);
    const detectedScreens: ScreenInfo[] = [];

    try {
      if ("getScreenDetails" in window) {
        const permission = await navigator.permissions.query({ name: "window-management" as any });
        
        if (permission.state !== "granted") {
          await (window as any).getScreenDetails();
        }

        setPermissionGranted(true);

        const details = await (window as any).getScreenDetails();
        
        details.screens.forEach((s: any, index: number) => {
          detectedScreens.push({
            id: `screen-${index}`,
            label: s.label || (s.isPrimary ? "Monitor Principal" : s.isInternal ? "Tela do Notebook" : `Tela ${index + 1}`),
            left: s.left,
            top: s.top,
            width: s.width,
            height: s.height,
            isPrimary: s.isPrimary,
            isInternal: s.isInternal,
            color: SCREEN_COLORS[index % SCREEN_COLORS.length]!,
          });
        });
      } else {
        setPermissionGranted(false);
        
        const primaryWidth = window.screen.width;
        const primaryHeight = window.screen.height;
        const availWidth = window.screen.availWidth;
        const availLeft = (window.screen as any).availLeft as number;

        detectedScreens.push({
          id: "screen-0",
          label: "Monitor Principal",
          left: 0,
          top: 0,
          width: primaryWidth,
          height: primaryHeight,
          isPrimary: true,
          isInternal: true,
          color: SCREEN_COLORS[0]!,
        });

        if (availLeft > 0) {
          detectedScreens.push({
            id: "screen-1",
            label: "Tela Externa (Esquerda)",
            left: -availLeft,
            top: 0,
            width: availWidth - primaryWidth,
            height: primaryHeight,
            isPrimary: false,
            isInternal: false,
            color: SCREEN_COLORS[1]!,
          });
        } else if (availWidth > primaryWidth) {
          detectedScreens.push({
            id: "screen-1",
            label: "Tela Externa (Direita)",
            left: primaryWidth,
            top: 0,
            width: availWidth - primaryWidth,
            height: primaryHeight,
            isPrimary: false,
            isInternal: false,
            color: SCREEN_COLORS[1]!,
          });
        }
      }
    } catch (error) {
      console.error("Erro ao detectar telas:", error);
    }

    setScreens(detectedScreens);
    setDetecting(false);
  }, []);

  useEffect(() => {
    detectScreens();
  }, [detectScreens]);

  const getScreenRole = (screenId: string): ScreenRole => {
    const assignment = assignments.find(a => a.screenId === screenId);
    return assignment?.role || "available";
  };

  const assignRole = (screenId: string, role: ScreenRole) => {
    const currentRole = getScreenRole(screenId);
    let newAssignments = [...assignments];

    if (currentRole === role) {
      newAssignments = newAssignments.filter(a => a.screenId !== screenId);
    } else {
      if (role === "main" || role === "stage") {
        newAssignments = newAssignments.filter(a => a.role !== role && a.screenId !== screenId);
        newAssignments = newAssignments.filter(a => a.screenId !== screenId);
        newAssignments.push({ screenId, role });
      }
    }

    saveAssignments(newAssignments);
  };

  const openWindowOnScreen = (screenId: string, url: string, windowName: string): Window | null => {
    const screen = screens.find(s => s.id === screenId);
    if (!screen) return null;

    const features = [
      `left=${screen.left}`,
      `top=${screen.top}`,
      `width=${screen.width}`,
      `height=${screen.height}`,
      "menubar=no",
      "toolbar=no",
      "location=no",
      "status=no",
      "resizable=yes",
    ].join(",");

    const win = window.open(url, windowName, features);

    if (win) {
      setTimeout(() => {
        win.focus();
        try {
          win.document.documentElement.requestFullscreen();
        } catch (e) {}
      }, 500);
    }

    return win;
  };

  const openPresentationWindows = (channelName: string) => {
    const mainAssignment = assignments.find(a => a.role === "main");
    const stageAssignment = assignments.find(a => a.role === "stage");

    const windows: { role: string; window: Window | null; screen: ScreenInfo | undefined }[] = [];

    if (mainAssignment) {
      const screen = screens.find(s => s.id === mainAssignment.screenId);
      const win = openWindowOnScreen(
        mainAssignment.screenId,
        `/presentation/main?channel=${channelName}`,
        "main-display"
      );
      windows.push({ role: "main", window: win, screen });
    }

    if (stageAssignment) {
      const screen = screens.find(s => s.id === stageAssignment.screenId);
      const win = openWindowOnScreen(
        stageAssignment.screenId,
        `/presentation/stage?channel=${channelName}`,
        "stage-display"
      );
      windows.push({ role: "stage", window: win, screen });
    }

    return windows;
  };

  const getRoleBadge = (role: ScreenRole) => {
    switch (role) {
      case "main":
        return (
          <Badge className="bg-blue-600 text-white text-[10px] gap-1">
            <Tv className="h-3 w-3" /> Telão
          </Badge>
        );
      case "stage":
        return (
          <Badge className="bg-green-600 text-white text-[10px] gap-1">
            <Radio className="h-3 w-3" /> Púlpito
          </Badge>
        );
      default:
        return null;
    }
  };

  const getRoleIcon = (role: ScreenRole) => {
    switch (role) {
      case "main": return <Tv className="h-4 w-4" />;
      case "stage": return <Radio className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  const mainScreen = assignments.find(a => a.role === "main");
  const stageScreen = assignments.find(a => a.role === "stage");

  return (
    <>
      {showManager && (
        <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center">
          <div className="bg-gray-900 text-white rounded-lg w-[800px] max-w-[95vw] max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-900 p-6 pb-4 border-b border-gray-700 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <MonitorPlay className="h-5 w-5 text-blue-400" />
                  Gerenciador de Telas
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  {screens.length} tela(s) detectada(s)
                  {!permissionGranted && " (modo básico)"}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowManager(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-6 space-y-4">
              {detecting ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3 text-blue-400" />
                  <p className="text-gray-400">Detectando telas...</p>
                </div>
              ) : screens.length === 0 ? (
                <div className="text-center py-8">
                  <Monitor className="h-12 w-12 mx-auto mb-3 text-gray-600" />
                  <p className="text-gray-400 mb-4">Nenhuma tela detectada</p>
                  <Button onClick={detectScreens} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" /> Tentar Novamente
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-400">
                      Configure qual tela será usada para cada função:
                    </p>
                    <Button onClick={detectScreens} variant="ghost" size="sm" className="text-xs">
                      <RefreshCw className="h-3 w-3 mr-1" /> Redetectar
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {screens.map((screen) => {
                      const role = getScreenRole(screen.id);
                      return (
                        <div
                          key={screen.id}
                          className="relative border rounded-lg p-4 transition-all"
                          style={{
                            borderColor: screen.color,
                            backgroundColor: role !== "available" ? `${screen.color}15` : "transparent",
                          }}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <div
                                  className="w-3 h-3 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: screen.color }}
                                />
                                <h3 className="font-medium text-sm">
                                  {screen.label}
                                </h3>
                                {screen.isPrimary && (
                                  <Badge variant="outline" className="text-[10px] border-yellow-500 text-yellow-500">
                                    Principal
                                  </Badge>
                                )}
                                {screen.isInternal && (
                                  <Badge variant="outline" className="text-[10px]">
                                    <Laptop className="h-3 w-3 mr-1" /> Notebook
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-gray-400">
                                {screen.width} × {screen.height}px
                                {screen.left !== 0 && ` • Posição: ${screen.left > 0 ? "direita" : "esquerda"}`}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              {getRoleBadge(role)}
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant={role === "main" ? "default" : "outline"}
                                  className={`h-8 text-xs ${role === "main" ? "bg-blue-600" : ""}`}
                                  onClick={() => assignRole(screen.id, "main")}
                                >
                                  <Tv className="h-3 w-3 mr-1" />
                                  Telão
                                  {role === "main" && <Check className="h-3 w-3 ml-1" />}
                                </Button>
                                <Button
                                  size="sm"
                                  variant={role === "stage" ? "default" : "outline"}
                                  className={`h-8 text-xs ${role === "stage" ? "bg-green-600" : ""}`}
                                  onClick={() => assignRole(screen.id, "stage")}
                                >
                                  <Radio className="h-3 w-3 mr-1" />
                                  Púlpito
                                  {role === "stage" && <Check className="h-3 w-3 ml-1" />}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="bg-gray-800 rounded-lg p-4">
                    <h3 className="text-sm font-medium mb-3">Resumo da Configuração</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-3">
                        <p className="text-xs text-blue-400 mb-1 flex items-center gap-1">
                          <Tv className="h-3 w-3" /> Tela Principal (Telão)
                        </p>
                        {mainScreen ? (
                          <p className="text-sm text-white">
                            {screens.find(s => s.id === mainScreen.screenId)?.label || "Não definida"}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-500">Não definida</p>
                        )}
                      </div>
                      <div className="bg-green-900/30 border border-green-700 rounded-lg p-3">
                        <p className="text-xs text-green-400 mb-1 flex items-center gap-1">
                          <Radio className="h-3 w-3" /> Tela de Retorno (Púlpito)
                        </p>
                        {stageScreen ? (
                          <p className="text-sm text-white">
                            {screens.find(s => s.id === stageScreen.screenId)?.label || "Não definida"}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-500">Não definida</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {screens.length < 3 && (
                    <p className="text-yellow-400 text-xs">
                      ⚠️ Para o setup completo, conecte 2 monitores externos além do notebook.
                    </p>
                  )}
                </>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-900 p-4 border-t border-gray-700 flex gap-3">
              <Button variant="outline" onClick={() => setShowManager(false)} className="flex-1">
                Fechar
              </Button>
              {!mainScreen && !stageScreen && screens.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => {
                    if (screens.length >= 1) assignRole(screens[0]!.id, "main");
                    if (screens.length >= 2) assignRole(screens[1]!.id, "stage");
                  }}
                  className="flex-1"
                >
                  Auto Configurar
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowManager(true)}
        className="text-xs text-gray-400 hover:text-white"
      >
        <MonitorPlay className="h-3 w-3 mr-1" />
        Gerenciar Telas
      </Button>
    </>
  );
}