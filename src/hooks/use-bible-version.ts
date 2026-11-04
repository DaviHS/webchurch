"use client";

import { useState } from "react";

const STORAGE_KEY = "bible-version";

function readStored(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function useBibleVersion(versions: { code: string }[] | undefined): [string | null, (code: string) => void] {
  const [chosen, setChosen] = useState<string | null>(readStored);

  const available = chosen && versions?.some((v) => v.code === chosen) ? chosen : (versions?.[0]?.code ?? null);

  const set = (code: string) => {
    setChosen(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      return;
    }
  };

  return [available, set];
}
