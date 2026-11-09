/** "11999998888" -> "(11) 99999-8888"; fixo "1133334444" -> "(11) 3333-4444". Só dígitos, no máximo 11. */
export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  const area = digits.slice(0, 2);
  const rest = digits.slice(2);
  const split = rest.length > 8 ? 5 : 4;
  return rest.length <= split ? `(${area}) ${rest}` : `(${area}) ${rest.slice(0, split)}-${rest.slice(split)}`;
}

/** Telefone com DDD: 10 (fixo) ou 11 dígitos (celular). */
export const isValidPhone = (value: string) => /^\d{10,11}$/.test(value.replace(/\D/g, ""));
