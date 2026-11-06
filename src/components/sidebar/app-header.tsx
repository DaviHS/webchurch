"use client"

import { Fragment } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Globe, Home, LogOut } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { ThemeToggle } from "@/components/theme-toggle"
import { BIBLE_LINK, getBreadcrumbs } from "@/config/navigation"
import { logoutAndClearFilters } from "@/lib/auth"
import { cn } from "@/lib/utils"

export const headerIconButton =
  "flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-primary [&_svg]:size-4"

export function AppHeader() {
  const pathname = usePathname()
  const [home, ...rest] = getBreadcrumbs(pathname)
  const onBible = pathname === BIBLE_LINK.url || pathname.startsWith(`${BIBLE_LINK.url}/`)

  return (
    <header className="sticky top-2 z-20 print:hidden mx-4 my-2 flex h-14 shrink-0 items-center gap-2 rounded-md bg-card/95 px-3 shadow-sm ring-1 ring-border backdrop-blur-md sm:px-4">
      <SidebarTrigger className={headerIconButton} />
      <Separator orientation="vertical" className="mx-1 h-5!" />

      <Breadcrumb className="min-w-0 flex-1">
        <BreadcrumbList className="flex-nowrap">
          <BreadcrumbItem>
            {rest.length > 0 ? (
              <BreadcrumbLink asChild>
                <Link href="/app" className="flex items-center gap-1">
                  <Home className="size-4" />
                  <span className="hidden text-sm sm:inline">{home?.label}</span>
                </Link>
              </BreadcrumbLink>
            ) : (
              <BreadcrumbPage className="flex items-center gap-1">
                <Home className="size-4" />
                <span className="text-sm">{home?.label}</span>
              </BreadcrumbPage>
            )}
          </BreadcrumbItem>
          {rest.map((item, index) => {
            const isLast = index === rest.length - 1
            return (
              <Fragment key={item.label}>
                <BreadcrumbSeparator className={cn(!isLast && "hidden sm:block")} />
                <BreadcrumbItem className={cn("min-w-0", !isLast && "hidden sm:inline-flex")}>
                  {isLast ? (
                    <BreadcrumbPage className="truncate text-sm font-medium">{item.label}</BreadcrumbPage>
                  ) : (
                    <span className="text-sm">{item.label}</span>
                  )}
                </BreadcrumbItem>
              </Fragment>
            )
          })}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto flex items-center gap-2">
        <Link
          href={BIBLE_LINK.url}
          title={BIBLE_LINK.title}
          aria-current={onBible ? "page" : undefined}
          className={cn(headerIconButton, onBible && "border-primary/50 bg-primary/10 text-primary")}
        >
          <BIBLE_LINK.icon />
          <span className="sr-only">{BIBLE_LINK.title}</span>
        </Link>
        <ThemeToggle className={headerIconButton} />
        <Link href="/" className={cn(headerIconButton, "hidden sm:flex")} title="Site da igreja">
          <Globe />
          <span className="sr-only">Site da igreja</span>
        </Link>
        <button
          type="button"
          onClick={() => void logoutAndClearFilters()}
          className="flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-medium text-muted-foreground transition-colors hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="size-4" />
          <span className="hidden sm:inline">Sair</span>
        </button>
      </div>
    </header>
  )
}
