const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" &&
  value !== null &&
  (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);

export function cleanEmptyStrings<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item: unknown) => cleanEmptyStrings(item)) as T;
  }

  if (!isPlainObject(value)) {
    return value;
  }

  const cleaned: Record<string, unknown> = {};

  for (const [key, entry] of Object.entries(value)) {
    if (entry === null || entry === undefined) continue;
    if (typeof entry === "string" && entry.trim() === "") continue;
    cleaned[key] = cleanEmptyStrings(entry);
  }

  return cleaned as T;
}

export type EmptyToNull<T> = {
  [K in keyof T]: string extends Exclude<T[K], undefined | null> ? Exclude<T[K], undefined> | null : Exclude<T[K], undefined>;
};

export function emptyStringsToNull<T extends Record<string, unknown>>(obj: T): EmptyToNull<T> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    result[key] = typeof value === "string" && value.trim() === "" ? null : value;
  }

  return result as EmptyToNull<T>;
}
