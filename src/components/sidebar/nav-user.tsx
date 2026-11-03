"use client"

import { ChevronsUpDown, LogOut } from "lucide-react"
import { useSession } from "next-auth/react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { logoutAndClearFilters } from "@/lib/auth"

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "U"
  if (parts.length === 1) return (parts[0] ?? "").slice(0, 2).toUpperCase()
  return `${parts[0]?.[0] ?? ""}${parts.at(-1)?.[0] ?? ""}`.toUpperCase()
}

function UserSummary({ name, email, initials }: { name: string; email: string; initials: string }) {
  return (
    <>
      <Avatar className="h-8 w-8 rounded-lg border">
        <AvatarFallback className="rounded-lg bg-primary/10 font-semibold text-primary">{initials}</AvatarFallback>
      </Avatar>
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-semibold">{name}</span>
        {email && <span className="truncate text-xs text-muted-foreground">{email}</span>}
      </div>
    </>
  )
}

export function NavUser() {
  const { data: session } = useSession()
  const name = session?.user.name?.trim() ?? ""
  const displayName = name === "" ? "Usuário" : name
  const email = session?.user.email ?? ""
  const initials = getInitials(displayName)

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="w-full rounded-md data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <UserSummary name={displayName} email={email} initials={initials} />
              <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-md p-1 shadow-md"
            side="top"
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5">
                <UserSummary name={displayName} email={email} initials={initials} />
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => void logoutAndClearFilters()}
              className="cursor-pointer rounded-sm text-destructive focus:bg-destructive/10 focus:text-destructive"
            >
              <LogOut className="mr-2 size-4 text-destructive" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
