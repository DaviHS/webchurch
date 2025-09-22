/**
 * Cleans an object by converting empty strings to null and optionally handling other cases
 * @param data The input object to clean
 * @param options Configuration options
 * @returns A new object with cleaned values
 */
export function cleanEmptyStrings<T extends Record<string, any>>(
  data: T,
  options: {
    convertEmptyArrays?: boolean;
    convertEmptyObjects?: boolean;
    preserveFalse?: boolean;
  } = {}
): T {
  const {
    convertEmptyArrays = false,
    convertEmptyObjects = false,
    preserveFalse = true,
  } = options;

  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => {
      // Preserve Date objects
      if (value instanceof Date) return [key, value];
      
      // Handle empty strings
      if (value === "") return [key, null];
      
      // Handle empty arrays if enabled
      if (convertEmptyArrays && Array.isArray(value) && value.length === 0) {
        return [key, null];
      }
      
      // Handle empty objects if enabled
      if (convertEmptyObjects && isPlainObject(value) && Object.keys(value).length === 0) {
        return [key, null];
      }
      
      // Handle false values (optional)
      if (value === false && preserveFalse) {
        return [key, false];
      }
      
      // Recursively clean nested objects
      if (isPlainObject(value)) {
        return [key, cleanEmptyStrings(value, options)];
      }
      
      // Return the original value for all other cases
      return [key, value];
    })
  ) as T;
}

// Helper function to check if value is a plain object
function isPlainObject(value: any): boolean {
  return value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date);
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

