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
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession()

  const user = {
    name: session?.user?.name || "Usuário",
    email: session?.user?.email || "email@seuemail.com",
    treatment: "",
  }

  const navItems: NavItem[] = [
    {
      icon: Home,
      title: "Início",
      url: `/app`,
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
          title: "Membros",
          url: "/admin/members",
          resource: "members",
          action: "read",
        },
        {
          title: "Funções e Ministérios",
          url: "/admin/ministeries-functions",
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
                    <AvatarImage src={`/1.png`} alt="Church logo" />
                    <AvatarFallback>IC</AvatarFallback>
                  </Avatar>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Igreja Central</span>
                  <span className="truncate text-xs">Vida Com Próposito</span>
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
