"use client";

import { useState } from "react";
import { AlertTriangle, Loader2, Monitor, MonitorSmartphone, Projector, Tv } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { OUTPUT_LABELS, type OutputRole } from "../protocol";
import {
  assignScreen,
  detectScreens,
  isMultiScreen,
  isScreenDetectionSupported,
  resolveScreen,
  useDetectedScreens,
  useScreenAssignments,
  type DetectedScreen,
} from "../screens";

interface ScreenSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ROLE_STYLES: Record<OutputRole, { icon: typeof Projector; className: string }> = {
  projector: { icon: Projector, className: "border-emerald-500 bg-emerald-500/15" },
  stage: { icon: Tv, className: "border-sky-500 bg-sky-500/15" },
};

function ScreenLayout({
  screens,
  roleOf,
  onPick,
}: {
  screens: readonly DetectedScreen[];
  roleOf: (screen: DetectedScreen) => OutputRole | null;
  onPick: (screen: DetectedScreen, role: OutputRole) => void;
}) {
  const minLeft = Math.min(...screens.map((s) => s.left));
  const minTop = Math.min(...screens.map((s) => s.top));
  const totalWidth = Math.max(...screens.map((s) => s.left + s.width)) - minLeft;
  const totalHeight = Math.max(...screens.map((s) => s.top + s.height)) - minTop;

  return (
    <div className="overflow-x-auto">
      <div className="relative mx-auto w-full min-w-[480px]" style={{ aspectRatio: `${totalWidth} / ${totalHeight}` }}>
        {screens.map((screen) => {
          const role = roleOf(screen);
          const RoleIcon = role ? ROLE_STYLES[role].icon : screen.isCurrent ? MonitorSmartphone : Monitor;
          return (
            <div
              key={screen.key}
              className={cn(
                "absolute flex flex-col items-center justify-center gap-1 rounded-md border-2 p-2 text-center",
                role ? ROLE_STYLES[role].className : "border-border bg-muted/40"
              )}
              style={{
                left: `${((screen.left - minLeft) / totalWidth) * 100}%`,
                top: `${((screen.top - minTop) / totalHeight) * 100}%`,
                width: `calc(${(screen.width / totalWidth) * 100}% - 6px)`,
                height: `calc(${(screen.height / totalHeight) * 100}% - 6px)`,
              }}
            >
              <RoleIcon className="h-5 w-5 shrink-0" />
              <p className="line-clamp-1 text-xs font-semibold">{screen.label}</p>
              <p className="text-[10px] text-muted-foreground">
                {screen.width}×{screen.height}
              </p>
              <div className="flex flex-wrap justify-center gap-1">
                {screen.isCurrent && <Badge variant="secondary" className="px-1 py-0 text-[10px]">Painel</Badge>}
                {role && <Badge className="px-1 py-0 text-[10px]">{OUTPUT_LABELS[role]}</Badge>}
              </div>
              <div className="mt-1 flex gap-1">
                {(["projector", "stage"] as const).map((target) => (
                  <Button
                    key={target}
                    type="button"
                    size="sm"
                    variant={role === target ? "default" : "outline"}
                    className="h-6 px-2 text-[10px]"
                    onClick={() => onPick(screen, target)}
                  >
                    {OUTPUT_LABELS[target]}
                  </Button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ScreenSetupDialog({ open, onOpenChange }: ScreenSetupDialogProps) {
  const screens = useDetectedScreens();
  const assignments = useScreenAssignments();
  const [detecting, setDetecting] = useState(false);
  const supported = isScreenDetectionSupported();

  const handleDetect = async () => {
    setDetecting(true);
    try {
      const found = await detectScreens();
      if (found.length < 2) {
        toast.warning("Só uma tela foi encontrada. Ligue o projetor e a TV e detecte de novo.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível detectar as telas.");
    } finally {
      setDetecting(false);
    }
  };

  const roleOf = (screen: DetectedScreen): OutputRole | null => {
    if (resolveScreen(assignments.projector, screens) === screen) return "projector";
    if (resolveScreen(assignments.stage, screens) === screen) return "stage";
    return null;
  };

  const handlePick = (screen: DetectedScreen, role: OutputRole) => {
    assignScreen(role, roleOf(screen) === role ? null : screen);
  };

  const looksHidden = screens.length === 1 && isMultiScreen();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Configurar telas</DialogTitle>
          <DialogDescription>
            Detecte os monitores e escolha qual é o projetor e qual é a TV de retorno. A escolha fica salva neste computador.
          </DialogDescription>
        </DialogHeader>

        {!supported ? (
          <div className="flex gap-3 rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
            <p>
              Este navegador não detecta telas. Use Chrome, Edge ou Brave. Sem detecção, as saídas abrem em janelas
              comuns: arraste cada uma para a tela certa e tecle <kbd className="rounded border px-1">F</kbd>.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <Button type="button" onClick={() => void handleDetect()} disabled={detecting}>
              {detecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Monitor className="mr-2 h-4 w-4" />}
              {screens.length > 0 ? "Detectar novamente" : "Detectar telas"}
            </Button>

            {screens.length > 0 && <ScreenLayout screens={screens} roleOf={roleOf} onPick={handlePick} />}

            {looksHidden && (
              <div className="flex gap-3 rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm">
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
                <p>
                  O sistema informa mais de um monitor, mas só um foi listado. No Brave, abra o ícone do leão (Shields)
                  e desative o bloqueio de fingerprinting para este site, depois detecte novamente.
                </p>
              </div>
            )}

            {screens.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Na primeira vez o navegador pergunta se o site pode gerenciar janelas em todas as telas — clique em{" "}
                <strong>Permitir</strong>.
              </p>
            )}
          </div>
        )}

        <div className="grid gap-2 text-sm sm:grid-cols-2">
          {(["projector", "stage"] as const).map((role) => {
            const ref = assignments[role];
            const Icon = ROLE_STYLES[role].icon;
            return (
              <div key={role} className="flex items-center gap-2 rounded-md border p-2">
                <Icon className="h-4 w-4 shrink-0" />
                <span className="font-medium">{OUTPUT_LABELS[role]}:</span>
                <span className="truncate text-muted-foreground">
                  {ref ? `${ref.label} (${ref.width}×${ref.height})` : "não definido"}
                </span>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
