import { SearchX } from "lucide-react";
import { ErrorState } from "@/components/error-state";

export default function NotFound() {
  return (
    <ErrorState
      icon={<SearchX />}
      title="Página não encontrada"
      description="O endereço não existe ou foi movido. Confira o link ou volte ao início."
    />
  );
}
