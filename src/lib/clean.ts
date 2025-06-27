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

export function cleanNulls<T extends object>(obj: T): T {
  const cleaned = {} as T

  for (const key in obj) {
    const value = obj[key]

    if (value === null) {
      cleaned[key] = undefined as any
    } else if (Array.isArray(value)) {
      cleaned[key] = value.map((item) =>
        typeof item === "object" && item !== null ? cleanNulls(item) : item
      ) as any
    } else if (typeof value === "object" && value !== null) {
      cleaned[key] = cleanNulls(value) as any
    } else {
      cleaned[key] = value
    }
  }

  return cleaned
}

