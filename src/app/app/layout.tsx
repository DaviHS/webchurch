import { Suspense, type PropsWithChildren } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { LoadingState } from "@/components/ui/loading-state";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { AppHeader } from "@/components/sidebar/app-header";
import { MobileNavigation } from "@/components/sidebar/mobile-nav";

export default function AppLayout({ children }: Readonly<PropsWithChildren>) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex min-h-svh min-w-0 flex-col bg-background">
        <AppHeader />
        <main className="w-full flex-1 p-4 print:p-0 pb-[calc(10rem+env(safe-area-inset-bottom))] md:p-6 md:pb-6">
          <Suspense fallback={<LoadingState />}>{children}</Suspense>
        </main>
        <MobileNavigation />
      </SidebarInset>
    </SidebarProvider>
  );
}
