"use client"

import { SidebarIcon, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useSidebar } from "@/components/ui/sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { usePageContext } from "@/contexts/page-context"
import { logoutAndClearFilters } from "@/lib/auth"
import Link from "next/link"

export function SiteHeader() {
  const { toggleSidebar } = useSidebar()
  const { title, subtitle, breadcrumbs } = usePageContext()

  const handleLogout = async () => {
    await logoutAndClearFilters()
  }

  return (
    <header className="flex sticky top-0 z-50 w-full items-center border-b bg-background">
      <div className="flex h-[--header-height] w-full items-center gap-2 px-4">
        <Button className="h-8 w-8" variant="ghost" size="icon" onClick={toggleSidebar}>
          <SidebarIcon />
        </Button>
        <Separator orientation="vertical" className="mr-2 h-4" />

        <div className="flex flex-col flex-1">
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((item, index) => (
                <div key={index} className="flex items-center">
                  {index > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem>
                    {item.href ? (
                      <BreadcrumbLink asChild>
                        <Link href={item.href}>{item.label}</Link>
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage>{item.label}</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                </div>
              ))}
            </BreadcrumbList>
          </Breadcrumb>

          {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
        </div>

        <Button className="ml-auto bg-transparent hover:bg-red-400 text-foreground" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
