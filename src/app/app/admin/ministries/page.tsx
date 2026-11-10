"use client";

import { useState } from "react";
import { Ban, Briefcase, Eye, KeyRound, Pencil, Plus, RotateCcw, Settings, Users, Workflow } from "lucide-react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageContainer, PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { SearchInput } from "@/components/search-input";
import { RowActionsMenu } from "@/components/row-actions-menu";
import { useConfirm } from "@/components/confirm-dialog";
import { useEntityDialog } from "@/hooks/use-entity-dialog";
import { usePermissions } from "@/hooks/use-permissions";
import { permissionLabel } from "@/lib/permissions";
import { mutationFeedback } from "@/lib/mutation-feedback";
import { cn } from "@/lib/utils";
import { MinistryDialog, type Ministry } from "./_components/ministry-dialog";
import { FunctionDialog, type MinistryFunction } from "./_components/function-dialog";
import { MinistryFunctionsDialog } from "./_components/ministry-functions-dialog";
import { FunctionPermissionsDialog } from "./_components/function-permissions-dialog";

type Tab = "ministries" | "functions";
type Situation = "active" | "inactive";

const plain = (value: string) => value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

const MAX_CHIPS = 4;

export default function MinistriesPage() {
  const [activeTab, setActiveTab] = useState<Tab>("ministries");
  const [search, setSearch] = useState("");
  const [situation, setSituation] = useState<Situation>("active");
  const [detail, setDetail] = useState<{ ministry: Ministry; tab: "functions" | "members" } | null>(null);
  const [permissionsFunction, setPermissionsFunction] = useState<MinistryFunction | null>(null);
  const { can } = usePermissions();
  const canManageAccess = can("users.manage");
  const canManageMinistries = can("ministries.manage");
  const ministryDialog = useEntityDialog<Ministry>();
  const functionDialog = useEntityDialog<MinistryFunction>();
  const confirm = useConfirm();
  const utils = api.useUtils();

  const { data: functionPermissions = {} } = api.access.listFunctionPermissions.useQuery(undefined, { enabled: canManageAccess });
  const { data: stats = [], isLoading: statsLoading } = api.ministry.getMinistryStats.useQuery();
  const { data: functions = [], isLoading: functionsLoading } = api.ministry.listFunctions.useQuery();
  const { data: links = [] } = api.ministry.listMinistryFunctions.useQuery();
  const { data: inactive } = api.ministry.listInactive.useQuery(undefined, { enabled: canManageMinistries });

  const functionsByMinistry = new Map<number, string[]>();
  const ministriesByFunction = new Map<number, string[]>();
  for (const link of links) {
    functionsByMinistry.set(link.ministryId, [...(functionsByMinistry.get(link.ministryId) ?? []), link.functionName]);
    const ministryName = stats.find((item) => item.ministry.id === link.ministryId)?.ministry.name;
    if (ministryName) ministriesByFunction.set(link.functionId, [...(ministriesByFunction.get(link.functionId) ?? []), ministryName]);
  }

  const refreshAll = () =>
    Promise.all([
      utils.ministry.getMinistryStats.invalidate(),
      utils.ministry.list.invalidate(),
      utils.ministry.listFunctions.invalidate(),
      utils.ministry.listInactive.invalidate(),
      utils.ministry.listMinistryFunctions.invalidate(),
    ]);

  const deactivateMinistry = api.ministry.deactivate.useMutation(
    mutationFeedback({ success: "Ministério desativado. Dá para reativar em Desativados.", error: "Erro ao desativar ministério", onSuccess: refreshAll }),
  );
  const reactivateMinistry = api.ministry.reactivate.useMutation(
    mutationFeedback({ success: "Ministério reativado", error: "Erro ao reativar ministério", onSuccess: refreshAll }),
  );
  const deactivateFunction = api.ministry.deactivateFunction.useMutation(
    mutationFeedback({ success: "Função desativada. Dá para reativar em Desativadas.", error: "Erro ao desativar função", onSuccess: refreshAll }),
  );
  const reactivateFunction = api.ministry.reactivateFunction.useMutation(
    mutationFeedback({ success: "Função reativada", error: "Erro ao reativar função", onSuccess: refreshAll }),
  );

  const handleDeactivateMinistry = async (ministry: Ministry, memberCount: number) => {
    const confirmed = await confirm({
      title: "Desativar ministério",
      description: `Tem certeza que deseja desativar o ministério "${ministry.name}"?${
        memberCount > 0
          ? ` ${memberCount} ${memberCount === 1 ? "pessoa participa" : "pessoas participam"} dele e deixa${memberCount === 1 ? "" : "m"} de receber as permissões das funções que exercem nele.`
          : ""
      } Dá para reativar depois.`,
      confirmLabel: "Desativar",
      destructive: true,
    });
    if (confirmed) deactivateMinistry.mutate({ id: ministry.id });
  };

  const handleDeactivateFunction = async (item: MinistryFunction, memberCount: number) => {
    const confirmed = await confirm({
      title: "Desativar função",
      description: `Tem certeza que deseja desativar a função "${item.name}"?${
        memberCount > 0 ? ` ${memberCount} ${memberCount === 1 ? "pessoa a exerce" : "pessoas a exercem"} e deixa${memberCount === 1 ? "" : "m"} de receber as permissões dela.` : ""
      } Dá para reativar depois.`,
      confirmLabel: "Desativar",
      destructive: true,
    });
    if (confirmed) deactivateFunction.mutate({ id: item.id });
  };

  const query = plain(search.trim());
  const matches = (name: string, description?: string | null) => query === "" || plain(`${name} ${description ?? ""}`).includes(query);

  const isMinistries = activeTab === "ministries";
  const inactiveItems = isMinistries ? (inactive?.ministries ?? []) : (inactive?.functions ?? []);
  const inactiveCount = inactiveItems.length;
  const activeCount = isMinistries ? stats.length : functions.length;
  const showingInactive = situation === "inactive" && inactiveCount > 0;

  const visibleMinistries = stats.filter(({ ministry }) => matches(ministry.name, ministry.description));
  const visibleFunctions = functions.filter((item) => matches(item.name, item.description));
  const visibleInactive = inactiveItems.filter((item) => matches(item.name));

  const isLoading = isMinistries ? statsLoading : functionsLoading;
  const stretchedLink =
    "text-left underline-offset-4 after:absolute after:inset-0 after:content-[''] hover:underline focus-visible:underline focus-visible:outline-none";

  return (
    <PageContainer>
      <PageHeader
        title="Ministérios e Funções"
        description="Os ministérios reúnem as pessoas; as funções definem o que cada uma pode fazer no sistema"
        icon={Workflow}
        actions={
          canManageMinistries && (
            <Button onClick={isMinistries ? ministryDialog.openCreate : functionDialog.openCreate} className="w-full sm:w-auto">
              <Plus className="mr-2 size-4" />
              {isMinistries ? "Novo ministério" : "Nova função"}
            </Button>
          )
        }
      />

      <div className="space-y-3">
        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            setActiveTab(value as Tab);
            setSituation("active");
            setSearch("");
          }}
        >
          <TabsList className="grid w-full grid-cols-2 sm:max-w-md">
            <TabsTrigger value="ministries" className="gap-2">
              <Users className="size-4" />
              Ministérios ({stats.length})
            </TabsTrigger>
            <TabsTrigger value="functions" className="gap-2">
              <Briefcase className="size-4" />
              Funções ({functions.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={isMinistries ? "Buscar ministério..." : "Buscar função..."}
          className="sm:max-w-md"
        />

        {canManageMinistries && inactiveCount > 0 && (
          <div className="flex gap-2" role="group" aria-label="Situação">
            <Button type="button" size="sm" variant={showingInactive ? "outline" : "default"} aria-pressed={!showingInactive} onClick={() => setSituation("active")}>
              Ativos ({activeCount})
            </Button>
            <Button type="button" size="sm" variant={showingInactive ? "default" : "outline"} aria-pressed={showingInactive} onClick={() => setSituation("inactive")}>
              {isMinistries ? "Desativados" : "Desativadas"} ({inactiveCount})
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <LoadingState message={isMinistries ? "Carregando ministérios..." : "Carregando funções..."} />
      ) : showingInactive ? (
        visibleInactive.length === 0 ? (
          <Card>
            <EmptyState icon={isMinistries ? Users : Briefcase} title="Nada encontrado" description="Nenhum item desativado com essa busca." />
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {visibleInactive.map((item) => (
              <Card key={item.id} className="opacity-80">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="min-w-0 break-words text-lg">{item.name}</CardTitle>
                    <Badge variant="outline">{isMinistries ? "Desativado" : "Desativada"}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={reactivateMinistry.isPending || reactivateFunction.isPending}
                    onClick={() => (isMinistries ? reactivateMinistry.mutate({ id: item.id }) : reactivateFunction.mutate({ id: item.id }))}
                  >
                    <RotateCcw className="mr-2 size-4" />
                    Reativar
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : isMinistries ? (
        stats.length === 0 ? (
          <Card>
            <EmptyState
              icon={Users}
              title="Nenhum ministério cadastrado"
              description="Comece criando o primeiro ministério da igreja."
              action={
                canManageMinistries && (
                  <Button onClick={ministryDialog.openCreate}>
                    <Plus className="mr-2 size-4" />
                    Novo ministério
                  </Button>
                )
              }
            />
          </Card>
        ) : visibleMinistries.length === 0 ? (
          <Card>
            <EmptyState icon={Users} title="Nenhum ministério encontrado" description="Tente outro termo de busca." />
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {visibleMinistries.map(({ ministry, memberCount, functionCount }) => {
              const names = functionsByMinistry.get(ministry.id) ?? [];
              return (
                <Card key={ministry.id} className="relative flex cursor-pointer flex-col transition-shadow hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="min-w-0 break-words text-lg">
                        <button type="button" onClick={() => setDetail({ ministry, tab: "members" })} className={stretchedLink}>
                          {ministry.name}
                        </button>
                      </CardTitle>
                      <RowActionsMenu
                        label={`Ações do ministério ${ministry.name}`}
                        className="relative z-10 -mr-2 -mt-2"
                        actions={[
                          { label: "Ver membros", icon: Eye, onSelect: () => setDetail({ ministry, tab: "members" }) },
                          { label: "Gerenciar funções", icon: Settings, hidden: !canManageMinistries, onSelect: () => setDetail({ ministry, tab: "functions" }) },
                          { label: "Editar ministério", icon: Pencil, hidden: !canManageMinistries, onSelect: () => ministryDialog.openEdit(ministry) },
                          {
                            label: "Desativar ministério",
                            icon: Ban,
                            destructive: true,
                            hidden: !canManageMinistries,
                            disabled: deactivateMinistry.isPending,
                            onSelect: () => void handleDeactivateMinistry(ministry, memberCount),
                          },
                        ]}
                      />
                    </div>
                    {ministry.description && <CardDescription className="line-clamp-2 break-words">{ministry.description}</CardDescription>}
                  </CardHeader>
                  <CardContent className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Users className="size-4" />
                        {memberCount} {memberCount === 1 ? "membro" : "membros"}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Briefcase className="size-4" />
                        {functionCount} {functionCount === 1 ? "função" : "funções"}
                      </span>
                    </div>
                    {names.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {names.slice(0, MAX_CHIPS).map((name) => (
                          <Badge key={name} variant="secondary" className="text-xs">
                            {name}
                          </Badge>
                        ))}
                        {names.length > MAX_CHIPS && (
                          <Badge variant="outline" className="text-xs">
                            +{names.length - MAX_CHIPS}
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )
      ) : functions.length === 0 ? (
        <Card>
          <EmptyState
            icon={Briefcase}
            title="Nenhuma função cadastrada"
            description="Comece criando a primeira função."
            action={
              canManageMinistries && (
                <Button onClick={functionDialog.openCreate}>
                  <Plus className="mr-2 size-4" />
                  Nova função
                </Button>
              )
            }
          />
        </Card>
      ) : visibleFunctions.length === 0 ? (
        <Card>
          <EmptyState icon={Briefcase} title="Nenhuma função encontrada" description="Tente outro termo de busca." />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {visibleFunctions.map((item) => {
            const usedIn = ministriesByFunction.get(item.id) ?? [];
            const permissions = functionPermissions[item.id] ?? [];
            const clickable = canManageAccess || canManageMinistries;
            const openMain = () => {
              if (canManageAccess) setPermissionsFunction(item);
              else functionDialog.openEdit(item);
            };
            return (
              <Card key={item.id} className={cn("relative transition-shadow hover:shadow-md", clickable && "cursor-pointer")}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="min-w-0 break-words text-lg">
                      {clickable ? (
                        <button type="button" onClick={openMain} className={stretchedLink}>
                          {item.name}
                        </button>
                      ) : (
                        item.name
                      )}
                    </CardTitle>
                    <RowActionsMenu
                      label={`Ações da função ${item.name}`}
                      className="relative z-10 -mr-2 -mt-2"
                      actions={[
                        { label: "Permissões de acesso", icon: KeyRound, hidden: !canManageAccess, onSelect: () => setPermissionsFunction(item) },
                        { label: "Editar função", icon: Pencil, hidden: !canManageMinistries, onSelect: () => functionDialog.openEdit(item) },
                        {
                          label: "Desativar função",
                          icon: Ban,
                          destructive: true,
                          hidden: !canManageMinistries,
                          disabled: deactivateFunction.isPending,
                          onSelect: () => void handleDeactivateFunction(item, item.memberCount),
                        },
                      ]}
                    />
                  </div>
                  {item.description && <CardDescription className="line-clamp-3 break-words">{item.description}</CardDescription>}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Users className="size-4" />
                      {item.memberCount} {item.memberCount === 1 ? "pessoa" : "pessoas"}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Workflow className="size-4" />
                      {item.ministryCount} {item.ministryCount === 1 ? "ministério" : "ministérios"}
                    </span>
                  </div>
                  {usedIn.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {usedIn.slice(0, MAX_CHIPS).map((name) => (
                        <Badge key={name} variant="outline" className="text-xs">
                          {name}
                        </Badge>
                      ))}
                      {usedIn.length > MAX_CHIPS && (
                        <Badge variant="outline" className="text-xs">
                          +{usedIn.length - MAX_CHIPS}
                        </Badge>
                      )}
                    </div>
                  )}
                  {canManageAccess && (
                    <div className="space-y-1.5 border-t pt-3">
                      <p className="text-xs font-medium text-muted-foreground">Permissões de acesso</p>
                      <div className="flex flex-wrap gap-1">
                        {permissions.length === 0 ? (
                          <span className="text-xs text-muted-foreground">Só consulta</span>
                        ) : (
                          permissions.map((permission) => (
                            <Badge key={permission} variant="secondary" className="text-xs">
                              {permissionLabel(permission)}
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <MinistryDialog ministry={ministryDialog.editing} open={ministryDialog.open} onOpenChange={ministryDialog.onOpenChange} />

      <FunctionDialog functionItem={functionDialog.editing} open={functionDialog.open} onOpenChange={functionDialog.onOpenChange} />

      <MinistryFunctionsDialog
        ministry={detail?.ministry ?? null}
        initialTab={detail?.tab}
        open={detail !== null}
        onOpenChange={(open) => {
          if (!open) setDetail(null);
        }}
      />

      <FunctionPermissionsDialog
        fn={permissionsFunction}
        current={permissionsFunction ? (functionPermissions[permissionsFunction.id] ?? []) : []}
        open={permissionsFunction !== null}
        onOpenChange={(open) => {
          if (!open) setPermissionsFunction(null);
        }}
      />
    </PageContainer>
  );
}
