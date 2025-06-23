"use client"

import type * as React from "react"
import { Home, Activity, BarChart3, ClipboardCheck, Shield } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { NavMain, type NavItem } from "./nav-main"
import { NavUser } from "./nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { usePermissions } from "@/hooks/use-permissions"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession()
  const { isAdmin } = usePermissions()

  const user = {
    name: session?.user.fullName || "Usuário",
    email: session?.user.email || "email@seuemail.com",
    treatment: "",
  }

  const navItems: NavItem[] = [
    {
      icon: Home,
      title: "Início",
      url: `/app`,
    },
    {
      icon: Activity,
      title: "Walkarounds",
      url: `/app/walkarounds`,
      resource: "walkarounds",
      action: "read",
    },
    // Menu Administrativo - apenas para admins
    {
      icon: Shield,
      title: "Administração",
      url: "#",
      roles: ["super_admin", "admin"],
      items: [
        {
          title: "Dashboard Admin",
          url: "/admin",
          roles: ["super_admin", "admin"],
        },
        {
          title: "Usuários",
          url: "/admin/users",
          resource: "users",
          action: "read",
        },
        {
          title: "Empresas",
          url: "/admin/companies",
          resource: "companies",
          action: "read",
        },
        {
          title: "Vínculos",
          url: "/admin/user-company",
          resource: "users",
          action: "read",
        },
        {
          title: "Funções e Permissões",
          url: "/admin/roles",
          resource: "settings",
          action: "update",
        },
        {
          title: "Relatórios",
          url: "/admin/reports",
          resource: "reports",
          action: "read",
        },
        {
          title: "Configurações",
          url: "/admin/settings",
          resource: "settings",
          action: "read",
        },
      ],
    },
    // Menu para supervisores
    {
      icon: BarChart3,
      title: "Relatórios",
      url: `/app/reports`,
      roles: ["supervisor", "admin", "super_admin"],
      resource: "reports",
      action: "read",
    },
  ]

  return (
    <Sidebar className="top-[--header-height] !h-[calc(100svh-var(--header-height))]" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href={`/app`}>
                <div className="flex h-14 items-center gap-3">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={`/logo-aviao.png`} alt="Company logo" />
                    <AvatarFallback>RS</AvatarFallback>
                  </Avatar>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">RampSync</span>
                  <span className="truncate text-xs">{isAdmin() ? "Administrador" : "Sistema de Atendimentos"}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
