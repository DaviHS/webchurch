"use client"

import Image from "next/image"
import Link from "next/link"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { NavMain } from "./nav-main"
import { NavUser } from "./nav-user"

export function AppSidebar() {
  return (
    <Sidebar variant="floating">
      <SidebarHeader className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/app" className="flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-sidebar-accent">
              <span className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#003F2D] shadow-xs ring-1 ring-border/40">
                <Image src="/icons/icon-192.png" alt="" width={36} height={36} className="object-cover" priority />
              </span>
              <span className="flex flex-col text-left leading-none">
                <span className="text-base font-extrabold tracking-wider text-sidebar-foreground">IGREJA CENTRAL</span>
                <span className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                  Vida com propósito
                </span>
              </span>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <NavMain />
      </SidebarContent>

      <SidebarFooter className="border-t border-border/60 px-2 pt-2">
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
