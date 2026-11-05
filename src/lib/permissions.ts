export const PERMISSION_GROUPS = [
  {
    title: "Louvor",
    items: [
      { key: "songs.edit", label: "Criar e editar músicas", description: "Inclui mesclar duplicadas e sincronizar a playlist." },
      { key: "events.edit", label: "Criar e editar eventos", description: "Inclui repertório, participantes e passagens bíblicas." },
    ],
  },
  {
    title: "Pessoas",
    items: [
      { key: "members.manage", label: "Gerenciar membros", description: "Cadastrar, editar e desativar membros." },
      { key: "ministries.manage", label: "Gerenciar ministérios e funções", description: "Criar e editar ministérios e funções." },
      { key: "users.manage", label: "Gerenciar acessos", description: "Aprovar cadastros, redefinir senhas e definir os perfis de cada pessoa." },
    ],
  },
  {
    title: "Finanças",
    items: [{ key: "finance.access", label: "Acessar as finanças", description: "Ver e editar lançamentos, categorias e fechamentos." }],
  },
] as const;

export type Permission = (typeof PERMISSION_GROUPS)[number]["items"][number]["key"];

export const PERMISSIONS: Permission[] = PERMISSION_GROUPS.flatMap((group) => group.items.map((item) => item.key));

export const isPermission = (value: unknown): value is Permission => PERMISSIONS.some((permission) => permission === value);
