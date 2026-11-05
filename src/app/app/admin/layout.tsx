"use client";

import type { PropsWithChildren } from "react";
import { usePathname } from "next/navigation";
import { Lock } from "lucide-react";
import { PageContainer } from "@/components/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { findActiveLink } from "@/config/navigation";
import { usePermissions } from "@/hooks/use-permissions";

export default function AdminLayout({ children }: Readonly<PropsWithChildren>) {
  const pathname = usePathname();
  const { can, isLoading } = usePermissions();

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingState />
      </PageContainer>
    );
  }

  if (!can(findActiveLink(pathname)?.link.permission)) {
    return (
      <PageContainer>
        <EmptyState
          icon={Lock}
          title="Acesso restrito"
          description="Você não tem permissão para acessar esta área. Fale com um administrador."
        />
      </PageContainer>
    );
  }

  return children;
}
