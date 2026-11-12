export interface BirthdayPerson {
  name: string;
  turning: number | null;
}

const label = (person: BirthdayPerson) => (person.turning ? `${person.name} (${person.turning} anos)` : person.name);

export function birthdayMessage(people: BirthdayPerson[]): { title: string; body: string } | null {
  const [first, ...rest] = people;
  if (!first) return null;
  if (rest.length === 0) return { title: "Aniversariante de hoje", body: label(first) };
  return {
    title: `${people.length} aniversariantes hoje`,
    body: people.map(label).join(", "),
  };
}

export function saoPauloToday(now: Date = new Date()): { iso: string; month: number; day: number } {
  const iso = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const [, month = "0", day = "0"] = iso.split("-");
  return { iso, month: Number(month), day: Number(day) };
}
