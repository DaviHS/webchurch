"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function useCreateRequest() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const requested = params.get("novo") === "1";

  const dismiss = () => {
    if (requested) router.replace(pathname, { scroll: false });
  };

  return { requested, dismiss };
}
