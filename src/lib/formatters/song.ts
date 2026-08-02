export function abbreviateArtist(name: string): string {
  if (!name) return '';
  
  const parts = name.trim().split(' ');
  if (parts.length === 1) return name;
  
  const firstName = parts[0];
  const lastPart = parts[parts.length - 1] || '';
  const lastNameInitial = lastPart.charAt(0);
  
  return `${firstName} ${lastNameInitial}.`;
}

export function formatDuration(seconds: number): string {
  if (!seconds) return "-";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function getCategoryName(category: string): string {
  const categories: Record<string, string> = {
    hymn: "Hino",
    praise: "Louvor",
    worship: "Adoração",
    chorus: "Coro",
    special: "Especial"
  };
  return categories[category] || category;
}

export function getEventTypeName(type: string): string {
  const types: Record<string, string> = {
    cult: "Culto",
    celebration: "Celebração",
    meeting: "Reunião",
    conference: "Conferência",
    rehearsal: "Ensaio",
    other: "Outro",
    template: "Template"
  };
  return types[type] || type;
}

export function getEventTypeColor(type: string): string {
  const colors: Record<string, string> = {
    cult: "bg-blue-100 text-blue-800 border-blue-200",
    celebration: "bg-green-100 text-green-800 border-green-200",
    meeting: "bg-purple-100 text-purple-800 border-purple-200",
    conference: "bg-orange-100 text-orange-800 border-orange-200",
    rehearsal: "bg-yellow-100 text-yellow-800 border-yellow-200",
    template: "bg-gray-100 text-gray-800 border-gray-200",
    other: "bg-gray-100 text-gray-800 border-gray-200",
  };
  return colors[type] || "bg-gray-100 text-gray-800 border-gray-200";
}