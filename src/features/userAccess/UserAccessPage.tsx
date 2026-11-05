import { useState } from "react";
import { UserPlus, Loader2, Users } from "lucide-react";
import toast from "react-hot-toast";
import { Button, EmptyState, QueryFeedback, ConfirmationModal } from "@/shared/components/ui";
import { useUsers, type User } from "@/hooks/useUsers";
import { apiErrorMessage } from "@/features/bookings/utils/helpers";

import {
  InviteUserModal,
  UsersTable,
  DEFAULT_DISPATCH_PERMISSIONS,
  type InviteData,
} from "@/features/userAccess";

const emptyInviteData = (): InviteData => ({
  firstName: "",
  lastName: "",
  email: "",
  role: "",
  permissions: [...DEFAULT_DISPATCH_PERMISSIONS],
});

const UserAccess = ({ role }: { role?: string | null }) => {
  const { users, loading, isError, loadError, toggleStatus, inviteUser, refetch } = useUsers();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteData, setInviteData] = useState<InviteData>(emptyInviteData);
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<User | null>(null);
  const [revokeLoading, setRevokeLoading] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteSubmitting(true);
    try {
      const result = await inviteUser(inviteData);
      setShowInviteModal(false);
      setInviteData(emptyInviteData());
      toast.success(result?.message || "Dispatcher added successfully");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Failed to add dispatcher"));
    } finally {
      setInviteSubmitting(false);
    }
  };

  const confirmRevoke = async () => {
    if (!revokeTarget) return;
    setRevokeLoading(true);
    try {
      await toggleStatus(revokeTarget.id);
      toast.success("User banned — access revoked");
      setRevokeTarget(null);
    } catch (err) {
      toast.error(apiErrorMessage(err, "Failed to revoke access"));
    } finally {
      setRevokeLoading(false);
    }
  };

  if (loading && users.length === 0 && !isError) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-sm text-ink-4">Loading staff…</p>
        </div>
      </div>
    );
  }

  if (isError && users.length === 0) {
    return (
      <QueryFeedback
        title="Could not load staff"
        message={apiErrorMessage(
          loadError,
          "Unable to fetch dispatchers. Check your connection and try again.",
        )}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="type-page-title">User Management</h1>
          <p className="text-ink-3 font-semibold mt-1 tracking-normal">
            Manage Admin, Driver &amp; Customer access
          </p>
        </div>
        <Button variant="primary" icon={UserPlus} onClick={() => setShowInviteModal(true)}>
          Add A Role
        </Button>
      </div>

      {users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No dispatchers yet"
          description="Add a dispatcher to assign page permissions and manage dashboard access."
          action={
            <Button variant="primary" icon={UserPlus} onClick={() => setShowInviteModal(true)}>
              Add A Role
            </Button>
          }
        />
      ) : (
        <UsersTable
          users={users}
          onRevokeAccess={(user) => {
            if (user.status === "active") setRevokeTarget(user);
          }}
          onRestoreAccess={async (user) => {
            try {
              await toggleStatus(user.id);
              toast.success("User unbanned — access restored");
            } catch (err) {
              toast.error(apiErrorMessage(err, "Failed to restore access"));
            }
          }}
        />
      )}

      {showInviteModal && (
        <InviteUserModal
          inviteData={inviteData}
          setInviteData={setInviteData}
          onSubmit={handleInvite}
          onClose={() => !inviteSubmitting && setShowInviteModal(false)}
          isSubmitting={inviteSubmitting}
        />
      )}

      <ConfirmationModal
        isOpen={Boolean(revokeTarget)}
        title="Revoke access?"
        message={
          revokeTarget
            ? `${[revokeTarget.firstName, revokeTarget.lastName].filter(Boolean).join(" ") || revokeTarget.name} will lose dashboard access. You can restore them later if needed.`
            : ""
        }
        confirmText="Revoke access"
        variant="urgent"
        isLoading={revokeLoading}
        onConfirm={confirmRevoke}
        onClose={() => !revokeLoading && setRevokeTarget(null)}
      />
    </div>
  );
};

export default UserAccess;
