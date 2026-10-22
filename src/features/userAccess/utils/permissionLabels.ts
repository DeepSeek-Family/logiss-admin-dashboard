import { ALL_PERMISSIONS, PERMISSION_GROUPS, ROLE_PERMISSIONS } from '../permissions';

const normalizeKey = (key: string) => (key.startsWith('/') ? key : `/${key}`);

export interface ResolvedPermission {
  key: string;
  label: string;
  group: string;
}

export function resolvePermissions(keys: string[]): ResolvedPermission[] {
  const wanted = new Set(keys.map(normalizeKey));
  const resolved: ResolvedPermission[] = [];

  PERMISSION_GROUPS.forEach((g) => {
    g.perms.forEach((p) => {
      if (wanted.has(p.key)) {
        resolved.push({ key: p.key, label: p.label, group: g.group });
        wanted.delete(p.key);
      }
    });
  });

  wanted.forEach((key) => {
    resolved.push({ key, label: key.replace(/^\//, ''), group: 'Other' });
  });

  return resolved;
}

export function permissionsForUser(user: {
  role?: string;
  permissions?: string[];
}): ResolvedPermission[] {
  const role = (user.role || 'dispatcher').toLowerCase();
  if (role === 'admin') {
    return resolvePermissions(ALL_PERMISSIONS);
  }
  if (role === 'facility') {
    return resolvePermissions(ROLE_PERMISSIONS.facility || []);
  }
  const scope = user.permissions?.length ? user.permissions : [];
  return resolvePermissions(scope);
}
