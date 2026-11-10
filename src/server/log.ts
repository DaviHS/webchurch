export const logError = (scope: string, error: unknown) => {
  console.error(`[${scope}]`, error instanceof Error ? error.message : error);
};
