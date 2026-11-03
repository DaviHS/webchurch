export function safeParseNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

export function formatNumber(num: unknown): string {
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

export function formatMedia(num: unknown): string {
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

export function formatPercent(value: number, total: number): string {
  if (total === 0) return '0';
  return ((value / total) * 100).toFixed(1);
}