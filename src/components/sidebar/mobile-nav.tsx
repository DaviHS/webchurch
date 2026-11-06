"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { usePermissions } from "@/hooks/use-permissions"
import { MoreHorizontal, Plus } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  ALL_LINKS,
  MOBILE_PRIMARY_URLS,
  NAV_SECTIONS,
  STANDALONE_LINKS,
  QUICK_ACTIONS,
  canSee,
  findActiveLink,
  type NavLink,
} from "@/config/navigation"
import { cn } from "@/lib/utils"
import { useNavBadge } from "./nav-main"

const PRIMARY = ALL_LINKS.filter((link) => MOBILE_PRIMARY_URLS.includes(link.url))

function MoreLink({ link, isActive, onNavigate }: { link: NavLink; isActive: boolean; onNavigate: () => void }) {
  const count = useNavBadge(link.badge)
  return (
    <Link
      href={link.url}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/30 p-3.5 text-left text-xs font-semibold transition-all active:scale-[0.98]",
        isActive && "border-primary/50 bg-primary/10 text-primary"
      )}
    >
      <link.icon className="size-4 shrink-0 text-primary" />
      <span className="flex-1">{link.title}</span>
      {count > 0 && (
        <span className="rounded-full bg-destructive px-1.5 text-[10px] leading-4 text-destructive-foreground">{count}</span>
      )}
    </Link>
  )
}

export function MobileNavigation() {
  const pathname = usePathname()
  const active = findActiveLink(pathname)
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const [isFabOpen, setIsFabOpen] = useState(false)
  const { can, isLoading: permissionsLoading } = usePermissions()
  const quickActions = QUICK_ACTIONS.filter((action) => can(action.permission))

  // A Bíblia tem atalho próprio no cabeçalho, então não conta como item do "Mais".
  // O "Mais" só existe se houver algo liberado fora dos atalhos principais.
  const hasMore =
    !permissionsLoading &&
    NAV_SECTIONS.some((section) => section.items.some((link) => !MOBILE_PRIMARY_URLS.includes(link.url) && canSee(link, can)))

  const secondaryActive =
    active !== null && !MOBILE_PRIMARY_URLS.includes(active.link.url) && !STANDALONE_LINKS.includes(active.link)

  return (
    <div className="md:hidden print:hidden">
      {isFabOpen && (
        <div
          aria-hidden
          className="fixed inset-0 z-30 bg-background/60 backdrop-blur-xs"
          onClick={() => setIsFabOpen(false)}
        />
      )}
      {quickActions.length > 0 && (
        <div className="pointer-events-none fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 z-40 flex flex-col items-end gap-2">
          <div
            id="quick-actions"
            className={cn(
              "flex flex-col items-end gap-2 transition-all duration-200 ease-out",
              isFabOpen ? "pointer-events-auto translate-y-0 scale-100 opacity-100" : "pointer-events-none translate-y-4 scale-95 opacity-0"
            )}
          >
            {quickActions.map(({ title, url, icon: Icon }) => (
              <Link
                key={url}
                href={url}
                tabIndex={isFabOpen ? 0 : -1}
                onClick={() => setIsFabOpen(false)}
                className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-xs font-semibold shadow-lg active:scale-95"
              >
                <Icon className="size-4 text-primary" />
                {title}
              </Link>
            ))}
          </div>
          <button
            type="button"
            aria-label="Ações rápidas"
            aria-expanded={isFabOpen}
            aria-controls="quick-actions"
            onClick={() => setIsFabOpen((open) => !open)}
            className={cn(
              "pointer-events-auto flex size-13 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl transition-transform duration-200 active:scale-90",
              isFabOpen && "rotate-45"
            )}
          >
            <Plus className="size-6" />
          </button>
        </div>
  
      )}

      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-30 flex h-[calc(4.5rem+env(safe-area-inset-bottom))] items-start justify-around border-t border-border/80 bg-card/95 px-2 pt-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-md"
      >
        {PRIMARY.map((link) => {
          const isActive = active?.link === link
          return (
            <Link
              key={link.url}
              href={link.url}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex min-w-14 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-medium transition-colors",
                isActive ? "font-bold text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <link.icon className="size-5" />
              <span>{link.title}</span>
            </Link>
          )
        })}
        {hasMore && (
          <button
            type="button"
            onClick={() => setIsMoreOpen(true)}
            className={cn(
              "flex min-w-14 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-medium transition-colors",
              secondaryActive ? "font-bold text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <MoreHorizontal className="size-5" />
            <span>Mais</span>
          </button>
        )}
      </nav>

      <Sheet open={hasMore && isMoreOpen} onOpenChange={setIsMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          <SheetHeader className="text-left">
            <SheetTitle>Menu</SheetTitle>
            <SheetDescription className="sr-only">Outras telas do sistema</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 px-4">
            {NAV_SECTIONS.map((section) => {
              const links = section.items.filter((link) => !MOBILE_PRIMARY_URLS.includes(link.url) && canSee(link, can))
              if (links.length === 0) return null
              return (
                <div key={section.title} className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{section.title}</p>
                  <div className="grid grid-cols-2 gap-2.5">
                    {links.map((link) => (
                      <MoreLink
                        key={link.url}
                        link={link}
                        isActive={active?.link === link}
                        onNavigate={() => setIsMoreOpen(false)}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
