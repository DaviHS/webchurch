"use client"

import * as React from "react"
import { useIsMobile } from "@/hooks/use-is-mobile"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

const MobileContext = React.createContext(false)
const useMobileMode = () => React.useContext(MobileContext)

type RootProps = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

function ResponsiveDialog({ open, onOpenChange, children }: RootProps) {
  const isMobile = useIsMobile()
  return (
    <MobileContext.Provider value={isMobile}>
      {isMobile ? (
        <Drawer open={open} onOpenChange={onOpenChange} shouldScaleBackground={false} repositionInputs={false}>
          {children}
        </Drawer>
      ) : (
        <Dialog open={open} onOpenChange={onOpenChange}>
          {children}
        </Dialog>
      )}
    </MobileContext.Provider>
  )
}

function ResponsiveDialogTrigger(props: React.ComponentProps<typeof DialogTrigger>) {
  return useMobileMode() ? <DrawerTrigger {...props} /> : <DialogTrigger {...props} />
}

function ResponsiveDialogClose(props: React.ComponentProps<typeof DialogClose>) {
  return useMobileMode() ? <DrawerClose {...props} /> : <DialogClose {...props} />
}

const SIZES = {
  sm: "sm:max-w-md",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-4xl",
} as const

type ContentProps = {
  className?: string
  children: React.ReactNode
  size?: keyof typeof SIZES
}

function ResponsiveDialogContent({ className, children, size = "md" }: ContentProps) {
  if (useMobileMode()) {
    return (
      <DrawerContent className={cn("flex max-h-[95dvh] flex-col", className)}>
        {children}
      </DrawerContent>
    )
  }
  return (
    <DialogContent className={cn("flex max-h-[90dvh] flex-col gap-0 overflow-hidden p-0 sm:p-0", SIZES[size], className)}>
      {children}
    </DialogContent>
  )
}

function ResponsiveDialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const Header = useMobileMode() ? DrawerHeader : DialogHeader
  return <Header className={cn("shrink-0 px-4 pb-2 pt-4 text-left sm:px-6 sm:pt-6", className)} {...props} />
}

function ResponsiveDialogTitle(props: React.ComponentProps<typeof DialogTitle>) {
  return useMobileMode() ? <DrawerTitle {...props} /> : <DialogTitle {...props} />
}

function ResponsiveDialogDescription(props: React.ComponentProps<typeof DialogDescription>) {
  return useMobileMode() ? <DrawerDescription {...props} /> : <DialogDescription {...props} />
}

function ResponsiveDialogBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("min-h-0 flex-1 overflow-y-auto px-4 py-2 sm:px-6", className)} {...props} />
}

function ResponsiveDialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex shrink-0 flex-col-reverse gap-2 border-t bg-background px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:px-6 sm:pb-4",
        className
      )}
      {...props}
    />
  )
}

export {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
}
