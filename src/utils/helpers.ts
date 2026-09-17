const parseLocalYmd = (value: string): Date | null => {
  const ymd = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!ymd) return null;
  return new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]));
};

export const formatTime = (iso: string | number | Date | null | undefined): string => {
  if (!iso) return '';
  if (typeof iso === 'string' && /^\d{1,2}:\d{2}(?::\d{2})?\s*(AM|PM)$/i.test(iso.trim())) {
    return iso.trim().replace(/\s+/g, ' ');
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return typeof iso === 'string' ? iso : '';
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

export const formatShortDate = (iso: string | number | Date | null | undefined): string => {
  if (!iso) return '';
  if (typeof iso === 'string') {
    const local = parseLocalYmd(iso);
    if (local) return local.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return typeof iso === 'string' ? iso : '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const formatDateTime = (iso: string | number | Date | null | undefined): string => {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

export const timeAgo = (iso: string | number | Date | null | undefined): string => {
  if (!iso) return 'just now';
  const now = new Date();
  const past = new Date(iso);
  const diffInMs = now.getTime() - past.getTime();
  const diffInMins = Math.floor(diffInMs / 60000);
  const diffInHours = Math.floor(diffInMins / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMins < 1) return 'just now';
  if (diffInMins < 60) return `${diffInMins}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  return `${diffInDays}d ago`;
};

export const tripTypeLabel = (type: string): string => {
  const map: Record<string, string> = {
    'round_trip': 'Round Trip',
    'round-trip': 'Round Trip',
    'one_way': 'One Way',
    'one-way': 'One Way',
  };
  return map[type] || type;
};

export const money = (n: number): string => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
};
