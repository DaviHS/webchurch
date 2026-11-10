const isLeap = (year: number) => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

const dayOfYear = (year: number, month: number, day: number) => (month === 2 && day === 29 && !isLeap(year) ? 28 : day);

export function whatsappNumber(phone: string | null | undefined): string | null {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (digits.length < 10) return null;
  return digits.length <= 11 ? `55${digits}` : digits;
}

export interface MonthBirthday {
  day: number;
  turning: number;
  daysFromToday: number;
}

export function birthdayThisMonth(birthDate: string, today: string): MonthBirthday | null {
  const [birthYear = 0, month = 0, day = 0] = birthDate.split("-").map(Number);
  const [year = 0, todayMonth = 0, todayDay = 0] = today.split("-").map(Number);
  if (!birthYear || !month || !day || month !== todayMonth) return null;
  const shown = dayOfYear(year, month, day);
  return { day: shown, turning: year - birthYear, daysFromToday: shown - todayDay };
}

export function ageOn(birthDate: string, today: string): number | null {
  const [birthYear = 0, birthMonth = 0, birthDay = 0] = birthDate.split("-").map(Number);
  const [year = 0, month = 0, day = 0] = today.split("-").map(Number);
  if (!birthYear || !birthMonth || !birthDay || !year) return null;
  const age = year - birthYear - (month < birthMonth || (month === birthMonth && day < birthDay) ? 1 : 0);
  return age >= 0 ? age : null;
}
