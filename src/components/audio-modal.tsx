"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface AudioModalProps {
  isOpen: boolean
  onClose: () => void
  audioUrl: string
  title: string
}

type AudioStatus = "loading" | "ready" | "error"

const LOAD_ERROR_MESSAGE = "Erro ao carregar o áudio. Verifique sua conexão ou tente baixar o arquivo."

export function AudioModal({ isOpen, onClose, audioUrl, title }: AudioModalProps) {
  const [loaded, setLoaded] = useState<{ url: string; status: AudioStatus } | null>(null)
  const status: AudioStatus = loaded?.url === audioUrl ? loaded.status : "loading"

  const markReady = () => setLoaded({ url: audioUrl, status: "ready" })
  const markError = () => setLoaded({ url: audioUrl, status: "error" })

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gravação da Ligação</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col space-y-4 py-4">
          {status === "loading" && <div className="py-4 text-center text-muted-foreground">Carregando áudio...</div>}

          {status === "error" && (
            <div role="alert" className="py-2 text-center text-sm text-destructive">
              {LOAD_ERROR_MESSAGE}
            </div>
          )}

          <audio
            controls
            className="w-full"
            autoPlay={false}
            src={audioUrl}
            onCanPlay={markReady}
            onLoadedData={markReady}
            onError={markError}
          >
            Seu navegador não suporta o elemento de áudio.
          </audio>

          <div className="text-sm text-muted-foreground text-center">{title}</div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
