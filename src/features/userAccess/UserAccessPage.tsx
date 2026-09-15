import { useState } from 'react';
import { UserPlus, Loader2 } from 'lucide-react';
import { Button } from '@/shared/components/ui';
import { useUsers } from '@/hooks/useUsers';

import {
  InviteUserModal,
  UsersTable,
  DEFAULT_DISPATCH_PERMISSIONS
} from '@/features/userAccess';

const UserAccess = ({ role }: { role?: string | null }) => {
  const { users, loading, toggleStatus, inviteUser } = useUsers();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteData, setInviteData] = useState<{ name: string; email: string; role: string; permissions: string[]; facility?: string }>({ name: '', email: '', role: 'dispatcher', permissions: [...DEFAULT_DISPATCH_PERMISSIONS] });

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await inviteUser(inviteData);
      setShowInviteModal(false);
      setInviteData({ name: '', email: '', role: 'dispatcher', permissions: [...DEFAULT_DISPATCH_PERMISSIONS] });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-sm text-ink-4">Verifying Permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="type-page-title">User Management</h1>
          <p className="text-ink-3 font-semibold mt-1 tracking-normal">Manage Admin, Driver &amp; Customer access</p>
        </div>
        <Button variant="primary" icon={UserPlus} onClick={() => setShowInviteModal(true)}>Invite User</Button>
      </div>

      <UsersTable
        users={users}
        onToggleStatus={toggleStatus}
      />

      {showInviteModal && (
        <InviteUserModal
          inviteData={inviteData}
          setInviteData={setInviteData}
          onSubmit={handleInvite}
          onClose={() => setShowInviteModal(false)}
        />
      )}
    </div>
  );
};

export default UserAccess;
