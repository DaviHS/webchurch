export const stripAccents = (value: string) => value.normalize("NFD").replace(/\p{M}/gu, "");

export const fold = (value: string) => stripAccents(value).toLowerCase();

export const normalizeText = (value: string | null | undefined) =>
  fold(value ?? "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

const LEADING_ARTICLE = /^(o|a|os|as) /;

export const normalizeTitle = (value: string) => normalizeText(value).replace(LEADING_ARTICLE, "");

export const baseTitle = (value: string) =>
  normalizeTitle(value.replace(/\s*[([][^)\]]*[)\]]/g, "").replace(/\s+-\s+.*$/, ""));
