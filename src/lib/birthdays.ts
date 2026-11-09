const isLeap = (year: number) => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

/** Em ano que não é bissexto, quem nasceu em 29/02 comemora em 28/02. */
const dayOfYear = (year: number, month: number, day: number) => (month === 2 && day === 29 && !isLeap(year) ? 28 : day);

/** Número para o link do WhatsApp (só dígitos, com o 55 do Brasil quando faltar). */
export function whatsappNumber(phone: string | null | undefined): string | null {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (digits.length < 10) return null;
  return digits.length <= 11 ? `55${digits}` : digits;
}

export interface MonthBirthday {
  day: number;
  /** Idade que a pessoa completa neste ano. */
  turning: number;
  /** Negativo = já passou neste mês, 0 = hoje. */
  daysFromToday: number;
}

/** Aniversário da pessoa no mês de hoje, ou null se ela faz em outro mês. */
export function birthdayThisMonth(birthDate: string, today: string): MonthBirthday | null {
  const [birthYear = 0, month = 0, day = 0] = birthDate.split("-").map(Number);
  const [year = 0, todayMonth = 0, todayDay = 0] = today.split("-").map(Number);
  if (!birthYear || !month || !day || month !== todayMonth) return null;
  const shown = dayOfYear(year, month, day);
  return { day: shown, turning: year - birthYear, daysFromToday: shown - todayDay };
}
