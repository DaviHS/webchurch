"use client";

import { SidebarIcon, LogOut } from "lucide-react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useSidebar } from "@/components/ui/sidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList } from "@/components/ui/breadcrumb";
import { usePageTitle } from "@/hooks/use-page-title";
import { logoutAndClearFilters } from "@/lib/auth";
import Link from "next/link"; 

export function SiteHeader() {
  const { toggleSidebar } = useSidebar();
  const pathname = usePathname();
  const pageTitle = usePageTitle();

  const handleLogout = async () => {
    await logoutAndClearFilters();
  };

  return (
    <header className="flex sticky top-0 z-50 w-full items-center border-b bg-background">
      <div className="flex h-[--header-height] w-full items-center gap-2 px-4">
        <Button className="h-8 w-8" variant="ghost" size="icon" onClick={toggleSidebar}>
          <SidebarIcon />
        </Button>
        <Separator orientation="vertical" className="mr-2 h-4" />
        
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <Link href={`/app`}>
                Painel de Ligações
              </Link>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Button className="ml-auto bg-transparent hover:bg-red-400 text-foreground" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4"/>
        </Button>
      </div>
    </header>
  );
}
