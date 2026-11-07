"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { HOME_LINK, NAV_SECTIONS, STANDALONE_LINKS, canSee, findActiveLink, type NavLink } from "@/config/navigation"
import { usePermissions } from "@/hooks/use-permissions"
import { useOnline } from "@/hooks/use-online"
import { BIBLE_LINK } from "@/config/navigation"
import { cn } from "@/lib/utils"
import { api } from "@/trpc/react"

export function useNavBadge(badge: NavLink["badge"]): number {
  const { data } = api.user.getPendingCount.useQuery(undefined, {
    enabled: badge === "pendingUsers",
    staleTime: 60_000,
  })
  return badge === "pendingUsers" ? (data ?? 0) : 0
}

const topLevelButton = cn(
  "h-9 rounded-md px-3 text-sm font-medium transition-colors",
  "data-[active=true]:bg-primary data-[active=true]:text-primary-foreground",
  "data-[active=true]:hover:bg-primary/90 data-[active=true]:hover:text-primary-foreground"
)

function useCloseOnNavigate() {
  const { isMobile, setOpenMobile } = useSidebar()
  return () => {
    if (isMobile) setOpenMobile(false)
  }
}

function SubItem({ link, isActive }: { link: NavLink; isActive: boolean }) {
  const count = useNavBadge(link.badge)
  const closeOnNavigate = useCloseOnNavigate()

  return (
    <SidebarMenuSubItem>
      <SidebarMenuSubButton
        asChild
        isActive={isActive}
        className="h-8 rounded-md data-[active=true]:bg-muted data-[active=true]:font-medium data-[active=true]:text-foreground"
      >
        <Link href={link.url} aria-current={isActive ? "page" : undefined} onClick={closeOnNavigate}>
          <link.icon />
          <span className="truncate">{link.title}</span>
          {count > 0 && (
            <span className="ml-auto rounded-full bg-destructive px-1.5 text-[10px] font-semibold leading-4 text-destructive-foreground">
              {count}
            </span>
          )}
        </Link>
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
  )
}

export function NavMain() {
  const pathname = usePathname()
  const active = findActiveLink(pathname)
  const homeActive = active?.link === HOME_LINK
  const closeOnNavigate = useCloseOnNavigate()
  const { can } = usePermissions()
  const online = useOnline()

  // Sem internet só a Bíblia funciona (fica guardada no aparelho); o resto levaria a telas quebradas.
  const standalone = online ? STANDALONE_LINKS : [BIBLE_LINK]

  return (
    <SidebarGroup className="p-0">
      <SidebarGroupLabel className="px-1 text-xs font-medium uppercase tracking-wide text-sidebar-foreground/70">
        Menu principal
      </SidebarGroupLabel>
      <SidebarMenu className="gap-1">
        {online && (
        <SidebarMenuItem>
          <SidebarMenuButton asChild tooltip={HOME_LINK.title} isActive={homeActive} className={topLevelButton}>
            <Link href={HOME_LINK.url} aria-current={homeActive ? "page" : undefined} onClick={closeOnNavigate}>
              <HOME_LINK.icon />
              <span>{HOME_LINK.title}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        )}

        {standalone.map((link) => {
          const isActive = active?.link === link
          return (
            <SidebarMenuItem key={link.url}>
              <SidebarMenuButton asChild tooltip={link.title} isActive={isActive} className={topLevelButton}>
                <Link href={link.url} aria-current={isActive ? "page" : undefined} onClick={closeOnNavigate}>
                  <link.icon />
                  <span>{link.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}

        {(online ? NAV_SECTIONS : []).map((section) => {
          const links = section.items.filter((link) => canSee(link, can))
          // Sem nenhum item liberado, o grupo nem aparece (nem como recolhível vazio).
          if (links.length === 0) return null
          const sectionActive = active?.section === section
          return (
            <Collapsible key={section.title} asChild defaultOpen className="group/collapsible">
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={section.title} isActive={sectionActive} className={topLevelButton}>
                    <section.icon />
                    <span>{section.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub className="me-0 pe-0">
                    {links.map((link) => (
                      <SubItem key={link.url} link={link} isActive={active?.link === link} />
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
