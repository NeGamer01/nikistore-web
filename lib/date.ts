export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 7) {
    return formatDate(timestamp);
  }

  if (days > 0) {
    return `${days} hari yang lalu`;
  }

  if (hours > 0) {
    return `${hours} jam yang lalu`;
  }

  if (minutes > 0) {
    return `${minutes} menit yang lalu`;
  }

  return "Baru saja";
}
