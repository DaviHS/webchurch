export const AUDIT_AREAS: Record<string, string> = {
  song: "Músicas",
  event: "Eventos",
  member: "Membros",
  ministry: "Ministérios e funções",
  user: "Acessos",
  access: "Permissões",
  finance: "Finanças",
  auth: "Login e senha",
  privacy: "Privacidade",
};

const ACTIONS: Record<string, string> = {
  "song.create": "Criou música",
  "song.update": "Editou música",
  "song.delete": "Excluiu música",
  "song.merge": "Mesclou músicas duplicadas",
  "song.syncYouTubePlaylist": "Sincronizou a playlist do YouTube",

  "event.create": "Criou evento",
  "event.update": "Editou evento",
  "event.delete": "Excluiu evento",
  "event.addSong": "Adicionou música ao evento",
  "event.reorderSongs": "Reordenou o repertório do evento",
  "event.addSongToEnd": "Adicionou música ao fim do repertório do evento",
  "event.removeSong": "Removeu música do evento",
  "event.updateSongOrder": "Alterou a ordem ou os dados de uma música do evento",
  "event.addPassage": "Adicionou passagem bíblica ao evento",
  "event.removePassage": "Removeu passagem bíblica do evento",
  "event.addParticipant": "Adicionou participante ao evento",
  "event.removeParticipant": "Removeu participante do evento",
  "event.createTemplate": "Criou modelo de evento",
  "event.createFromTemplate": "Criou evento a partir de modelo",
  "event.duplicate": "Duplicou evento",

  "member.create": "Cadastrou membro",
  "member.update": "Editou membro",
  "member.deactivate": "Desativou membro",
  "privacy.exportMember": "Exportou os dados de um membro",
  "privacy.anonymizeMember": "Excluiu os dados pessoais de um membro",

  "ministry.create": "Criou ministério",
  "ministry.update": "Editou ministério",
  "ministry.deactivate": "Desativou ministério",
  "ministry.reactivate": "Reativou ministério",
  "ministry.reactivateFunction": "Reativou função",
  "ministry.createFunction": "Criou função",
  "ministry.updateFunction": "Editou função",
  "ministry.deactivateFunction": "Desativou função",
  "ministry.addFunctionToMinistry": "Vinculou função a ministério",
  "ministry.removeFunctionFromMinistry": "Removeu função de ministério",

  "user.create": "Criou acesso",
  "user.update": "Editou acesso",
  "user.deactivate": "Desativou acesso",
  "user.approve": "Aprovou cadastro",
  "user.reject": "Rejeitou cadastro",
  "user.reconsider": "Reconsiderou cadastro rejeitado",

  "access.setFunctionPermissions": "Alterou as permissões de uma função",

  "auth.requestPasswordReset": "Pediu redefinição de senha por e-mail",
  "auth.confirmPasswordReset": "Redefiniu a própria senha pelo link do e-mail",

  "finance.createCategory": "Criou categoria financeira",
  "finance.updateCategory": "Editou categoria financeira",
  "finance.setCategoryActive": "Ativou ou desativou categoria financeira",
  "finance.createDefaultCategories": "Criou as categorias padrão",
  "finance.createTransaction": "Lançou movimentação",
  "finance.updateTransaction": "Editou movimentação",
  "finance.deleteTransaction": "Excluiu movimentação",
  "finance.closeMonth": "Fechou o mês",
  "finance.reopenMonth": "Reabriu o mês",
};

export const auditActionLabel = (action: string) => ACTIONS[action] ?? action;

const scalar = (value: unknown): string =>
  typeof value === "string" || typeof value === "number" || typeof value === "boolean" ? String(value) : "…";

export function summarizeAuditInput(input: unknown): string {
  if (input === null || input === undefined) return "";
  if (typeof input !== "object") return `#${scalar(input)}`;
  const parts: string[] = [];
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (value === null || value === undefined || value === "") continue;
    const text = Array.isArray(value)
      ? `[${value.map(scalar).join(", ")}]`
      : scalar(value);
    parts.push(`${key}: ${text.length > 60 ? `${text.slice(0, 60)}…` : text}`);
  }
  return parts.join(" · ");
}
