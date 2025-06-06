import { useEffect, useState } from "react";

export function usePageTitle() {
  const [pageTitle, setPageTitle] = useState("Carregando...");

  useEffect(() => {
    setPageTitle(document.title);
  }, []);

  return pageTitle;
}
