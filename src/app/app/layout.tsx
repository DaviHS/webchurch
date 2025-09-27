"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import { type PropsWithChildren } from "react";
import { SiteHeader } from "@/components/sidebar/site-header";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoadingState } from "@/components/ui/loading-state";

export default function AppLayout({ children }: Readonly<PropsWithChildren>) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      router.push("/sign-in");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return <LoadingState />;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="[--header-height:calc(theme(spacing.14))]">
      <SidebarProvider className="flex flex-col h-full">
        <SiteHeader />
        <div className="flex flex-1 h-full">
          <AppSidebar />
          <div className="flex-1 h-full overflow-auto font-sans">
            <div className="w-full h-full overflow-x-hidden overflow-y-auto">
              <div className="mx-auto w-full">
                {children}
              </div>
            </div>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
}