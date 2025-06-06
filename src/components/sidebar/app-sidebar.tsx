"use client"

import type * as React from "react"
import { Home } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { NavMain } from "./nav-main"
// import { NavProjects } from "./nav-projects"
// import { NavSecondary } from "./nav-secundary"
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
import Link from "next/link"  // Importando o Link do Next.js

const data = {
  navMain: [
    {
      icon: Home,
      title: "Início",
      url: `/app`,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession()
  
  const user = {
    name: "Usuário",
    email: "email@casasandreluiz.org.br",
    treatment: "",
  }

  return (
    <Sidebar className="top-[--header-height] !h-[calc(100svh-var(--header-height))]" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              {/* Substituindo <a> por <Link> */}
              <Link href={`/app`}>
                <div className="flex h-10 items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={`/ico-ulp.png`} alt="Company logo" />
                    <AvatarFallback>CN</AvatarFallback>
                  </Avatar>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Casas André Luiz</span>
                  <span className="truncate text-xs">cad.casasandreluiz.org.br</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/*<NavProjects projects={data.projects} />*/}
        {/*<NavSecondary items={data.navSecondary} className="mt-auto" />*/}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
