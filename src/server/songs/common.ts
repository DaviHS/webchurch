export const emptyToNull = (value: string | null | undefined) =>
  value === undefined ? undefined : value === null || value.trim() === "" ? null : value;

export const normalizeLink = (value: string | null | undefined): string | null => {
  const trimmed = value?.trim();
  return trimmed === "" ? null : (trimmed ?? null);
};

export const integrationWarning = (what: string, error: unknown) => {
  console.error(`[integração] ${what}:`, error instanceof Error ? error.message : error);
  return `Música salva, mas ${what}. Avise o setor de desenvolvimento para verificar a integração.`;
};
