/**
 * Converte qualquer valor para número de forma segura
 */
export function safeParseNumber(value: any): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

/**
 * Formata números grandes para exibição compacta
 * Ex: 1000 -> "1K", 1000000 -> "1M"
 */
export function formatNumber(num: any): string {
  const number = safeParseNumber(num);

  if (number === 0) return '0';
  if (!isFinite(number)) return '0';

  if (number >= 1e21) {
    return number.toExponential(2);
  }

  if (number >= 1e9) {
    return (number / 1e9).toFixed(1) + 'B';
  }
  if (number >= 1e6) {
    return (number / 1e6).toFixed(1) + 'M';
  }
  if (number >= 1e3) {
    return (number / 1e3).toFixed(1) + 'K';
  }

  if (Number.isInteger(number)) {
    return number.toString();
  }
  return number.toFixed(1);
}

/**
 * Formata média aritmética
 */
export function formatMedia(num: any): string {
  const number = safeParseNumber(num);

  if (number === 0) return '0';
  if (!isFinite(number)) return '0';

  if (Number.isInteger(number)) {
    return number.toString();
  }

  if (number >= 1e10) {
    return number.toExponential(2);
  }

  return number.toFixed(1);
}

/**
 * Formata porcentagem
 */
export function formatPercent(value: number, total: number): string {
  if (total === 0) return '0';
  return ((value / total) * 100).toFixed(1);
}