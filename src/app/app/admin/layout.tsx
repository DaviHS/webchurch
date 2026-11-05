"use client";

import type { PropsWithChildren } from "react";
import { Lock } from "lucide-react";
import { useSession } from "next-auth/react";
import { PageContainer } from "@/components/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";

export default function AdminLayout({ children }: Readonly<PropsWithChildren>) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <PageContainer>
        <LoadingState />
      </PageContainer>
    );
  }

  if (session?.user.isAdmin !== true) {
    return (
      <PageContainer>
        <EmptyState icon={Lock} title="Acesso restrito" description="Esta área é apenas para administradores." />
      </PageContainer>
    );
  }

  return children;
}
