export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

export function timeAgo(iso: string): string {
  const sec = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (sec < 60) return 'ahora';
  if (sec < 3600) return `hace ${Math.floor(sec / 60)}m`;
  if (sec < 86400) return `hace ${Math.floor(sec / 3600)}h`;
  return `hace ${Math.floor(sec / 86400)}d`;
}
