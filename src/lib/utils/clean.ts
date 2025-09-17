export function cleanEmptyStrings(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(cleanEmptyStrings);
  }

  const cleaned: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      continue; // Pula valores nulos ou undefined
    }
    
    if (typeof value === 'string' && value.trim() === '') {
      continue; // Pula strings vazias
    }
    
    if (typeof value === 'object') {
      cleaned[key] = cleanEmptyStrings(value);
    } else {
      cleaned[key] = value;
    }
  }

  return cleaned;
}