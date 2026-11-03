"use client";

import { Suspense, useEffect, type PropsWithChildren } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { LoadingState } from "@/components/ui/loading-state";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { AppHeader } from "@/components/sidebar/app-header";
import { MobileNavigation } from "@/components/sidebar/mobile-nav";

export default function AppLayout({ children }: Readonly<PropsWithChildren>) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const mustChangePassword = session?.user.hasDefaultPassword === true;

  useEffect(() => {
    if (status === "loading") return;
    if (!session) router.push("/sign-in");
    else if (mustChangePassword) router.push("/change-password");
  }, [session, status, mustChangePassword, router]);

  if (status === "loading" || mustChangePassword) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <LoadingState />
      </div>
    );
  }

  if (!session) return null;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex min-h-svh min-w-0 flex-col bg-background">
        <AppHeader />
        <main className="w-full flex-1 p-4 pb-[calc(9rem+env(safe-area-inset-bottom))] md:p-6 md:pb-6">
          <Suspense fallback={<LoadingState />}>{children}</Suspense>
        </main>
        <MobileNavigation />
      </SidebarInset>
    </SidebarProvider>
  );
}
