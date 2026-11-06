import { inArray } from "drizzle-orm";
import { db } from "@/server/db";
import {
  eventParticipants,
  eventPassages,
  events,
  eventSongs,
  financialCategories,
  financialTransactions,
  functions,
  members,
  ministries,
  songs,
  users,
} from "@/server/db/schema";
import { isPermission, permissionLabel } from "@/lib/permissions";

type Entity =
  | "song"
  | "event"
  | "member"
  | "ministry"
  | "function"
  | "user"
  | "category"
  | "transaction"
  | "eventSong"
  | "eventPassage"
  | "eventParticipant";

/** Ações cujo `id` (ou a própria entrada numérica) aponta para esta entidade. */
const ID_ENTITY: Record<string, Entity> = {
  "song.update": "song",
  "song.delete": "song",
  "event.update": "event",
  "event.delete": "event",
  "event.removeSong": "eventSong",
  "event.removePassage": "eventPassage",
  "event.removeParticipant": "eventParticipant",
  "member.update": "member",
  "member.deactivate": "member",
  "privacy.exportMember": "member",
  "ministry.update": "ministry",
  "ministry.deactivate": "ministry",
  "ministry.updateFunction": "function",
  "ministry.deactivateFunction": "function",
  "user.update": "user",
  "user.deactivate": "user",
  "user.approve": "user",
  "user.reject": "user",
  "finance.updateCategory": "category",
  "finance.setCategoryActive": "category",
  "finance.updateTransaction": "transaction",
  "finance.deleteTransaction": "transaction",
};

/** Campos da entrada que apontam para uma entidade, em qualquer ação. */
const FIELD_ENTITY: Record<string, Entity> = {
  songId: "song",
  eventId: "event",
  memberId: "member",
  ministryId: "ministry",
  functionId: "function",
  categoryId: "category",
};

const LABELS: Record<Entity, string> = {
  song: "Música",
  event: "Evento",
  member: "Membro",
  ministry: "Ministério",
  function: "Função",
  user: "Acesso",
  category: "Categoria",
  transaction: "Movimentação",
  eventSong: "",
  eventPassage: "Passagem",
  eventParticipant: "",
};

const MAX_LENGTH = 300;

const numbers = (value: unknown): number[] =>
  (Array.isArray(value) ? value : [value]).filter((item): item is number => typeof item === "number" && Number.isInteger(item));

const text = (value: unknown): string | null => (typeof value === "string" && value.trim() ? value.trim() : null);

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

function newIds(): Record<Entity, Set<number>> {
  return {
    song: new Set(),
    event: new Set(),
    member: new Set(),
    ministry: new Set(),
    function: new Set(),
    user: new Set(),
    category: new Set(),
    transaction: new Set(),
    eventSong: new Set(),
    eventPassage: new Set(),
    eventParticipant: new Set(),
  };
}

/**
 * Descreve em palavras o alvo de uma ação ("Música: Quão grande é o meu Deus"). Roda ANTES da ação,
 * para que também funcione com o que ela exclui ou mescla.
 */
export async function describeAuditTarget(action: string, raw: unknown): Promise<string | null> {
  const ids = newIds();
  const own: string[] = [];
  const input = isRecord(raw) ? raw : null;

  const mainEntity = ID_ENTITY[action];
  if (mainEntity) for (const id of numbers(input ? input.id : raw)) ids[mainEntity].add(id);

  if (input) {
    for (const [field, entity] of Object.entries(FIELD_ENTITY)) for (const id of numbers(input[field])) ids[entity].add(id);
    for (const id of numbers(input.keepId)) ids.song.add(id);
    for (const id of numbers(input.removeIds)) ids.song.add(id);

    // Ações de criação ainda não têm registro: o nome vem da própria entrada.
    const created =
      text(input.title) ??
      text(input.name) ??
      text(input.description) ??
      text(input.email) ??
      (text(input.firstName) ? `${text(input.firstName)} ${text(input.lastName) ?? ""}`.trim() : null);
    if (created && /\.(create|createCategory|createFunction|createTransaction)$/.test(action)) own.push(created);
    if (action === "event.addPassage" && text(input.reference)) own.push(`Passagem: ${text(input.reference)}`);
    if (typeof input.month === "number" && typeof input.year === "number") own.push(`Mês: ${input.month}/${input.year}`);
    if (action === "access.setFunctionPermissions" && Array.isArray(input.permissions)) {
      const labels = input.permissions.filter(isPermission).map(permissionLabel);
      own.push(`Permissões: ${labels.length > 0 ? labels.join(", ") : "nenhuma"}`);
    }
  }

  // Linhas de ligação (música/passagem/participante do evento) levam ao evento, à música e ao membro.
  const passageLabels = new Map<number, string>();
  const [songLinks, passageLinks, participantLinks] = await Promise.all([
    ids.eventSong.size ? db.select({ eventId: eventSongs.eventId, songId: eventSongs.songId }).from(eventSongs).where(inArray(eventSongs.id, [...ids.eventSong])) : [],
    ids.eventPassage.size
      ? db.select({ id: eventPassages.id, eventId: eventPassages.eventId, reference: eventPassages.reference }).from(eventPassages).where(inArray(eventPassages.id, [...ids.eventPassage]))
      : [],
    ids.eventParticipant.size
      ? db.select({ eventId: eventParticipants.eventId, memberId: eventParticipants.memberId }).from(eventParticipants).where(inArray(eventParticipants.id, [...ids.eventParticipant]))
      : [],
  ]);
  for (const link of songLinks) {
    ids.event.add(link.eventId);
    ids.song.add(link.songId);
  }
  for (const link of passageLinks) {
    ids.event.add(link.eventId);
    passageLabels.set(link.id, link.reference);
  }
  for (const link of participantLinks) {
    ids.event.add(link.eventId);
    ids.member.add(link.memberId);
  }

  const find = async <T extends { id: number }>(entity: Entity, query: (list: number[]) => Promise<T[]>) =>
    ids[entity].size ? query([...ids[entity]]) : ([] as T[]);

  const [songRows, eventRows, memberRows, ministryRows, functionRows, userRows, categoryRows, transactionRows] = await Promise.all([
    find("song", (list) => db.select({ id: songs.id, name: songs.title }).from(songs).where(inArray(songs.id, list))),
    find("event", (list) => db.select({ id: events.id, name: events.title }).from(events).where(inArray(events.id, list))),
    find("member", (list) =>
      db.select({ id: members.id, first: members.firstName, last: members.lastName }).from(members).where(inArray(members.id, list)),
    ),
    find("ministry", (list) => db.select({ id: ministries.id, name: ministries.name }).from(ministries).where(inArray(ministries.id, list))),
    find("function", (list) => db.select({ id: functions.id, name: functions.name }).from(functions).where(inArray(functions.id, list))),
    find("user", (list) => db.select({ id: users.id, name: users.email }).from(users).where(inArray(users.id, list))),
    find("category", (list) =>
      db.select({ id: financialCategories.id, name: financialCategories.name }).from(financialCategories).where(inArray(financialCategories.id, list)),
    ),
    find("transaction", (list) =>
      db
        .select({ id: financialTransactions.id, name: financialTransactions.description })
        .from(financialTransactions)
        .where(inArray(financialTransactions.id, list)),
    ),
  ]);

  const parts: string[] = [];
  const add = (entity: Entity, names: string[]) => {
    if (names.length > 0) parts.push(`${LABELS[entity]}: ${names.join(", ")}`);
  };

  if (action === "song.merge" && isRecord(raw)) {
    const byId = new Map(songRows.map((row) => [row.id, row.name]));
    const keep = typeof raw.keepId === "number" ? byId.get(raw.keepId) : undefined;
    const removed = numbers(raw.removeIds).map((id) => byId.get(id)).filter((name): name is string => !!name);
    if (keep) parts.push(`Mantida: ${keep}`);
    if (removed.length > 0) parts.push(`Removidas: ${removed.join(", ")}`);
  } else {
    add("song", songRows.map((row) => row.name));
  }
  add("event", eventRows.map((row) => row.name));
  add("member", memberRows.map((row) => `${row.first} ${row.last}`));
  add("ministry", ministryRows.map((row) => row.name));
  add("function", functionRows.map((row) => row.name));
  add("user", userRows.map((row) => row.name));
  add("category", categoryRows.map((row) => row.name));
  add("transaction", transactionRows.map((row) => row.name));
  add("eventPassage", [...passageLabels.values()]);
  parts.push(...own);

  const description = parts.join(" · ");
  if (!description) return null;
  return description.length > MAX_LENGTH ? `${description.slice(0, MAX_LENGTH)}…` : description;
}
