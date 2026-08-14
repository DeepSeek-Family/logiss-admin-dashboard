export type AppRole = 'admin' | 'dispatcher';
export type SessionRole = AppRole | null;

export const isAppRole = (role: unknown): role is AppRole => (
  role === 'admin' || role === 'dispatcher'
);
