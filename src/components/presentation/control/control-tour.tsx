"use client";

import { Joyride, STATUS, type EventData, type Step, type TooltipRenderProps } from "react-joyride";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TourStep {
  target: string;
  title: string;
  content: string;
  placement?: Step["placement"];
  spotlight?: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    target: "outputs",
    title: "Projetor e retorno",
    content: "Abra aqui as janelas do projetor e do retorno. O ponto verde indica que a tela está conectada.",
  },
  {
    target: "screens",
    title: "Telas",
    content: "Escolha qual monitor é o projetor e qual é a TV de retorno. Aqui também se baixa o arquivo de tela cheia automática para este computador.",
  },
  {
    target: "remote",
    title: "Controle pelo celular",
    content: "Gera um código para passar os slides pelo celular, longe do computador.",
  },
  {
    target: "tabs",
    title: "Repertório, estrofes e saídas",
    content: "No celular, a tela é dividida nestas três abas.",
  },
  {
    target: "setlist",
    title: "Repertório",
    content: "Escolha a música ou passagem para ver os slides. Dá para incluir músicas e passagens bíblicas na hora.",
    placement: "right",
  },
  {
    target: "slides-header",
    spotlight: "slides",
    title: "Slides",
    content:
      "Toque num slide para projetar. Vermelho é o que está no ar e azul é o próximo. No teclado, digite o número do slide para ir direto a ele.",
  },
  {
    target: "preview",
    title: "Prévia do projetor",
    content: "Mostra o que a igreja está vendo agora.",
    placement: "left",
  },
  {
    target: "video",
    title: "Vídeo do YouTube",
    content: "Cole um link para tocar um vídeo no projetor. Se o vídeo não permitir, ele abre no próprio YouTube, na tela do projetor.",
    placement: "left",
  },
  {
    target: "theme",
    title: "Tema",
    content: "Muda a cor de fundo do projetor.",
    placement: "left",
  },
  {
    target: "modes",
    title: "Tela preta, logo e sem letra",
    content: "Para esconder a letra sem perder o lugar. Toque de novo para voltar.",
    placement: "left",
  },
  {
    target: "projector-message",
    title: "Aviso no projetor",
    content: "Mostra um recado para a igreja, numa faixa embaixo do telão, por cima da letra ou do vídeo.",
    placement: "left",
  },
  {
    target: "stage-message",
    title: "Aviso no retorno",
    content: "Envia um recado que só a equipe vê, na TV do palco.",
    placement: "left",
  },
  {
    target: "mobile-controls",
    title: "Controles",
    content: "Passe os slides e use tela preta, logo ou sem letra.",
    placement: "top",
  },
  {
    target: "shortcuts",
    title: "Atalhos",
    content: "No teclado: setas ou espaço passam os slides, e B, L e C trocam o modo do projetor.",
    placement: "left",
  },
];

const selector = (target: string) => `[data-tour="${target}"]`;

function isVisible(target: string): boolean {
  const element = document.querySelector<HTMLElement>(selector(target));
  if (!element) return false;
  const box = element.getBoundingClientRect();
  return box.width > 0 && box.height > 0;
}

export function buildControlTourSteps(): Step[] {
  return TOUR_STEPS.filter((step) => isVisible(step.target)).map((step) => ({
    target: selector(step.target),
    title: step.title,
    content: step.content,
    placement: step.placement ?? "bottom",
    ...(step.spotlight && isVisible(step.spotlight) ? { spotlightTarget: selector(step.spotlight) } : {}),
  }));
}

function TourTooltip({ step, index, size, isLastStep, backProps, primaryProps, skipProps, tooltipProps }: TooltipRenderProps) {
  return (
    <div {...tooltipProps} className="w-[min(22rem,calc(100vw-2rem))] space-y-3 rounded-md border bg-popover p-4 text-popover-foreground shadow-lg">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          {step.title && <p className="font-semibold leading-tight">{step.title}</p>}
          <p className="mt-1 text-sm text-muted-foreground">{step.content}</p>
        </div>
        <Button type="button" size="icon-sm" variant="ghost" className="-mr-2 -mt-2 shrink-0" {...skipProps} aria-label="Fechar o tour">
          <X />
        </Button>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs tabular-nums text-muted-foreground">
          {index + 1} de {size}
        </span>
        <div className="flex gap-2">
          {index > 0 && (
            <Button type="button" size="sm" variant="outline" {...backProps}>
              Voltar
            </Button>
          )}
          <Button type="button" size="sm" {...primaryProps}>
            {isLastStep ? "Concluir" : "Próximo"}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface ControlTourProps {
  steps: Step[];
  onFinish: () => void;
}

export function ControlTour({ steps, onFinish }: ControlTourProps) {
  const handleEvent = (data: EventData) => {
    if (data.status === STATUS.FINISHED || data.status === STATUS.SKIPPED) onFinish();
  };

  return (
    <Joyride
      run={steps.length > 0}
      steps={steps}
      continuous
      scrollToFirstStep
      onEvent={handleEvent}
      tooltipComponent={TourTooltip}
      options={{
        skipBeacon: true,
        zIndex: 60,
        overlayColor: "rgb(0 0 0 / 0.55)",
        spotlightRadius: 8,
        overlayClickAction: false,
      }}
    />
  );
}
