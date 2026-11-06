"use client";

import { useState } from "react";
import { api } from "@/trpc/react";

const STORAGE_KEY = "bible-version";

function readStored(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Versão da Bíblia da pessoa. Vale a escolha feita agora, depois a preferência salva no perfil
 * (acompanha a pessoa entre aparelhos) e, por último, a guardada neste navegador.
 */
export function useBibleVersion(versions: { code: string }[] | undefined): [string | null, (code: string) => void] {
  const utils = api.useUtils();
  const [chosen, setChosen] = useState<string | null>(null);
  const [stored] = useState(readStored);
  const { data: preferences } = api.bible.preferences.useQuery(undefined, { staleTime: Infinity, refetchOnWindowFocus: false });
  const { mutate: savePreferences } = api.bible.savePreferences.useMutation();

  const available =
    [chosen, preferences?.version, stored].find((code) => code && versions?.some((v) => v.code === code)) ??
    versions?.[0]?.code ??
    null;

  const set = (code: string) => {
    setChosen(code);
    utils.bible.preferences.setData(undefined, (current) => ({ bookId: null, chapter: null, ...current, version: code }));
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      // Sem armazenamento local, a preferência do perfil continua valendo.
    }
    savePreferences({ version: code });
  };

  return [available, set];
}
