export const formatTime = (iso: string | number | Date | null | undefined): string => {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

export const formatShortDate = (iso: string | number | Date | null | undefined): string => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
    'one_way': 'One Way'
  };
  return map[type] || type;
};

export const money = (n: number): string => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
};
