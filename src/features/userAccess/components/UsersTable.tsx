import { Users, Shield, Mail, Building2 } from 'lucide-react';
import { Card, Badge, Avatar } from '@/shared/components/ui';
import { ALL_PERMISSIONS } from '../permissions';

interface UsersTableProps {
  users: any[];
  onToggleStatus: (id: string) => void;
}

export const UsersTable = ({ users, onToggleStatus }: UsersTableProps) => {
  return (
    <Card className="overflow-hidden border-line-2 shadow-sm">
      <div className="overflow-x-auto scrollbar-hide">
        <table className="w-full text-left">
          <thead className="bg-bg/50 border-b border-line-2">
            <tr>
              <th className="px-5 py-2.5 type-th whitespace-nowrap">User Profile</th>
              <th className="px-5 py-2.5 type-th whitespace-nowrap">Role</th>
              <th className="px-5 py-2.5 type-th whitespace-nowrap">Access Scope</th>
              <th className="px-5 py-2.5 type-th whitespace-nowrap">Status</th>
              <th className="px-5 py-2.5 type-th whitespace-nowrap">Last Active</th>
              <th className="px-5 py-2.5 type-th whitespace-nowrap text-right">Access</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line-2">
            {users.map((user: any) => (
              <tr key={user.id} className={`hover:bg-bg/50 transition-colors group ${user.status === 'inactive' ? 'opacity-50 grayscale' : ''}`}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <Avatar initials={user.name.split(' ').map((n: string) => n[0]).join('')} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-ink">{user.name}</p>
                      <p className="text-xs text-ink-4 flex items-center gap-1 mt-0.5">
                        <Mail size={10} /> {user.email}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {user.role === 'admin' ? (
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-primary-light/20 text-primary rounded-md w-fit border border-primary/20">
                      <Shield size={12} />
                      <span className="text-xs font-medium">Admin</span>
                    </div>
                  ) : user.role === 'facility' ? (
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-accent/10 text-accent rounded-md w-fit border border-accent/20">
                      <Building2 size={12} />
                      <span className="text-xs font-medium">Facility User</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-bg text-ink-3 rounded-md w-fit border border-line-2">
                      <Users size={12} />
                      <span className="text-xs font-medium">Dispatch</span>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  {user.role === 'admin' ? (
                    <span className="text-xs font-medium text-ink-3">Full access</span>
                  ) : user.role === 'facility' ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-ink-3"><Building2 size={11} className="text-ink-4" />{user.facility || 'No facility set'}</span>
                  ) : (
                    <Badge variant="primary" className="text-xs">{(user.permissions?.length ?? 0)} / {ALL_PERMISSIONS.length} permissions</Badge>
                  )}
                </td>
                <td className="px-6 py-4">
                  <Badge variant={user.status === 'active' ? 'accent' : 'neutral'} className="uppercase">
                    {user.status}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs text-ink-4">{user.lastLogin}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  {user.id !== 'LOGISS-882' && (
                    <button
                      onClick={() => onToggleStatus(user.id)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all border opacity-0 group-hover:opacity-100 ${
                        user.status === 'active'
                          ? 'text-urgent border-urgent hover:bg-urgent hover:text-white'
                          : 'text-accent border-accent hover:bg-accent hover:text-white'
                      }`}
                    >
                      {user.status === 'active' ? 'Revoke Access' : 'Restore Access'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
