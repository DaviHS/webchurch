"use client";

import { useState } from "react";
import { History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageContainer, PageHeader } from "@/components/page-header";
import { PaginationBar } from "@/components/pagination-bar";
import { SearchInput } from "@/components/search-input";
import { useDebounce } from "@/hooks/use-debounce";
import { AUDIT_AREAS, auditActionLabel, summarizeAuditInput } from "@/lib/audit-labels";
import { formatDateTime } from "@/lib/formatters";
import { api } from "@/trpc/react";

const PAGE_SIZE = 30;
const ALL = "all";

export default function AuditPage() {
  const [page, setPage] = useState(1);
  const [area, setArea] = useState(ALL);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  const { data, isLoading, error } = api.audit.list.useQuery(
    { page, limit: PAGE_SIZE, area: area === ALL ? undefined : area, search: debouncedSearch || undefined },
    { placeholderData: (previous) => previous },
  );

  return (
    <PageContainer>
      <PageHeader title="Histórico de alterações" icon={History} description="Quem alterou o quê no sistema." />

      <div className="flex flex-col gap-2 sm:flex-row">
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Buscar por pessoa ou ação"
          aria-label="Buscar no histórico"
        />
        <Select
          value={area}
          onValueChange={(value) => {
            setArea(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-56" aria-label="Área">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas as áreas</SelectItem>
            {Object.entries(AUDIT_AREAS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <p className="text-sm text-destructive">{error.message}</p>
      ) : !data || data.items.length === 0 ? (
        <EmptyState icon={History} title="Nada registrado" description="As alterações feitas no sistema aparecerão aqui." />
      ) : (
        <>
          <div className="space-y-2">
            {data.items.map((entry) => {
              const summary = summarizeAuditInput(entry.input);
              return (
                <Card key={entry.id}>
                  <CardContent className="space-y-1 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                      <p className="font-medium">{auditActionLabel(entry.action)}</p>
                      <span className="text-xs text-muted-foreground">{formatDateTime(entry.createdAt)}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <span>por {entry.userLabel}</span>
                      <Badge variant="outline" className="text-xs">
                        {AUDIT_AREAS[entry.action.split(".")[0] ?? ""] ?? entry.action}
                      </Badge>
                    </div>
                    {summary && <p className="break-words text-xs text-muted-foreground">{summary}</p>}
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <PaginationBar page={page} onPageChange={setPage} totalPages={data.totalPages} total={data.total} showing={data.items.length} itemLabel="registros" />
        </>
      )}
    </PageContainer>
  );
}
