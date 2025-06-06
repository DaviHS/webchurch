"use client"

import { useState, useRef, useEffect } from "react"
// import { Download } from "lucide-react"
// import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

interface AudioModalProps {
  isOpen: boolean
  onClose: () => void
  audioUrl: string
  title: string
}

export function AudioModal({ isOpen, onClose, audioUrl, title }: AudioModalProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    setIsLoading(true)
    setError(null)

    const handleCanPlay = () => {
      setIsLoading(false)
    }

    const handleError = () => {
      setError("Erro ao carregar o áudio. Verifique sua conexão ou tente baixar o arquivo.")
      setIsLoading(false)
    }

    if (audioRef.current) {
      audioRef.current.addEventListener("canplay", handleCanPlay)
      audioRef.current.addEventListener("error", handleError)
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener("canplay", handleCanPlay)
        audioRef.current.removeEventListener("error", handleError)
      }
    }
  }, [audioUrl])

  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = audioUrl
    link.download = title || "gravacao.mp3"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gravação da Ligação</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col space-y-4 py-4">
          {isLoading && <div className="text-center py-4">Carregando áudio...</div>}

          {error && <div className="text-center text-red-500 py-2">{error}</div>}

          <audio
            ref={audioRef}
            controls
            className="w-full"
            autoPlay={false}
            src={audioUrl}
            onLoadedData={() => setIsLoading(false)}
          >
            Seu navegador não suporta o elemento de áudio.
          </audio>

          <div className="text-sm text-muted-foreground text-center">{title}</div>
        </div>

       {/* <DialogFooter>
          <Button onClick={handleDownload} className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" />
            Baixar Gravação
          </Button>
        </DialogFooter> */}
      </DialogContent>
    </Dialog>
  )
}

