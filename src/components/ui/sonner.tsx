"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"
import { useIsMobile } from "@/hooks/use-is-mobile"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()
  const isMobile = useIsMobile()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      richColors
      closeButton
      visibleToasts={3}
      position={isMobile ? "top-center" : "bottom-right"}
      mobileOffset={{ top: "calc(4.75rem + env(safe-area-inset-top))" }}
      toastOptions={{
        duration: 3500,
        classNames: {
          toast: "group toast group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
