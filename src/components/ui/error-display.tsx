import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

interface ErrorDisplayProps {
  message: string
  title?: string
  onRetry?: () => void
  className?: string
}

export function ErrorDisplay({ message, title = "Erro", onRetry, className = "mt-4" }: ErrorDisplayProps) {
  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <p>{message}</p>
        {onRetry && (
          <Button type="button" size="sm" variant="outline" className="mt-2 bg-background text-foreground" onClick={onRetry}>
            Tentar de novo
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}
