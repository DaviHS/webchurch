import { redirect } from "next/navigation"
import { auth } from "@/server/auth"
import { SidebarProvider } from "@/components/ui/sidebar";
import { type PropsWithChildren } from "react";
import { SiteHeader } from "@/components/sidebar/site-header";
import { AppSidebar } from "@/components/sidebar/app-sidebar";

export default async function AppLayout({ children }: Readonly<PropsWithChildren>) {
  const session = await auth()
  if (!session?.user) redirect("/sign-in?from=/app")

  return (
    <div className="[--header-height:calc(theme(spacing.14))]">
      <SidebarProvider className="flex flex-col h-full">
        <SiteHeader />
        <div className="flex flex-1 h-full">
          <AppSidebar />
          <div className="flex-1 h-full overflow-auto font-sans">
            <div className="w-full h-full overflow-x-hidden overflow-y-auto">
              <div className="mx-auto w-full px-2 sm:px-2 lg:px-4">
                {children}
              </div>
            </div>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
}
