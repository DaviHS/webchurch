export interface CepResult {
  street: string;
  district: string;
  city: string;
  state: string;
}

export function formatCep(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

export const isCompleteCep = (value: string) => value.replace(/\D/g, "").length === 8;

interface ViaCepResponse {
  erro?: boolean | string;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
}

export async function lookupCep(cep: string, signal?: AbortSignal): Promise<CepResult | null> {
  const digits = cep.replace(/\D/g, "");
  if (digits.length !== 8) return null;
  const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`, { signal });
  if (!response.ok) throw new Error("Falha ao consultar o CEP");
  const data = (await response.json()) as ViaCepResponse;
  if (data.erro) return null;
  return {
    street: data.logradouro ?? "",
    district: data.bairro ?? "",
    city: data.localidade ?? "",
    state: (data.uf ?? "").toUpperCase(),
  };
}
