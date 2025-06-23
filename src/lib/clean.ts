export function cleanEmptyStrings<T extends Record<string, any>>(data: T): T {
  return Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, v === "" ? null : v])
  ) as T;
}

export function toStatus(value: string | undefined): "active" | "inactive" | "visiting" | "transferred" | undefined {
  if (value === "active" || value === "inactive" || value === "visiting" || value === "transferred") return value;
  return undefined;
}

export function toGender(value: string | undefined): "male" | "female" | undefined {
  if (value === "male" || value === "female") return value;
  return undefined;
}

export function toHasAccess(value: string | undefined): "true" | "false" | undefined {
  if (value === "true" || value === "false") return value;
  return undefined;
}
