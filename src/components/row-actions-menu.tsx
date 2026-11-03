"use client"

import type { ComponentType } from "react"
import { MoreVertical } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export interface RowAction {
  label: string
  icon: ComponentType<{ className?: string }>
  onSelect?: () => void
  href?: string
  destructive?: boolean
  disabled?: boolean
  hidden?: boolean
}

interface RowActionsMenuProps {
  actions: RowAction[]
  label?: string
  className?: string
}

export function RowActionsMenu({ actions, label = "Ações", className }: RowActionsMenuProps) {
  const visible = actions.filter((action) => !action.hidden)
  const regular = visible.filter((action) => !action.destructive)
  const destructive = visible.filter((action) => action.destructive)

  const renderItem = (action: RowAction) => {
    const content = (
      <>
        <action.icon className="mr-2 size-4" />
        {action.label}
      </>
    )
    return (
      <DropdownMenuItem
        key={action.label}
        disabled={action.disabled}
        asChild={Boolean(action.href)}
        onSelect={action.onSelect}
        className={cn("min-h-10 sm:min-h-8", action.destructive && "text-destructive focus:bg-destructive/10 focus:text-destructive")}
      >
        {action.href ? <Link href={action.href}>{content}</Link> : content}
      </DropdownMenuItem>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("shrink-0", className)}
          aria-label={label}
          onClick={(event) => event.stopPropagation()}
        >
          <MoreVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48" onClick={(event) => event.stopPropagation()}>
        {regular.map(renderItem)}
        {regular.length > 0 && destructive.length > 0 && <DropdownMenuSeparator />}
        {destructive.map(renderItem)}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
