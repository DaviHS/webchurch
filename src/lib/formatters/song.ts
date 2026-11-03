export function abbreviateArtist(name: string | null | undefined): string {
  const trimmed = name?.trim();
  if (!trimmed) return '';
  
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return trimmed;
  
  const firstName = parts[0];
  const lastPart = parts.at(-1) ?? '';
  const lastNameInitial = lastPart.charAt(0);
  
  return `${firstName} ${lastNameInitial}.`;
}

export function formatDuration(seconds: number): string {
  if (!seconds) return "-";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}
