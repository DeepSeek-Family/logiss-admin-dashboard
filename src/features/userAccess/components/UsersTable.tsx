import { useState } from "react";
import { Mail, Building2 } from "lucide-react";
import { Card, Badge, Avatar } from "@/shared/components/ui";
import { ALL_PERMISSIONS } from "../permissions";
import { AccessScopeModal } from "./AccessScopeModal";

interface UsersTableProps {
  users: any[];
  onRevokeAccess: (user: any) => void;
  onRestoreAccess: (user: any) => void;
}

const scopeTriggerClass =
  "text-left rounded-lg transition-colors hover:ring-2 hover:ring-primary/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30";

export const UsersTable = ({ users, onRevokeAccess, onRestoreAccess }: UsersTableProps) => {
  const [scopeUser, setScopeUser] = useState<any | null>(null);

  return (
    <>
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
              {users.map((user: any) => {
                const displayFirst = user.firstName || "";
                const displayLast = user.lastName || "";
                const initials =
                  `${displayFirst[0] || ""}${displayLast[0] || ""}`.toUpperCase() ||
                  user.name?.slice(0, 2).toUpperCase() ||
                  "U";
                return (
                  <tr
                    key={user.id}
                    className={`hover:bg-bg/50 transition-colors group ${user.status === "inactive" ? "bg-bg/40" : ""}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <Avatar initials={initials} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-ink">
                            {[displayFirst, displayLast].filter(Boolean).join(" ") || user.name}
                          </p>
                          <p className="text-xs text-ink-4 flex items-center gap-1 mt-0.5">
                            <Mail size={10} /> {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="text-sm font-medium text-ink"
                        title={user.middleName || undefined}
                      >
                        {user.middleName?.trim() || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.role === "admin" ? (
                        <button
                          type="button"
                          className={scopeTriggerClass}
                          onClick={() => setScopeUser(user)}
                        >
                          <span className="text-xs font-medium text-primary underline-offset-2 hover:underline">
                            Full access · {ALL_PERMISSIONS.length} pages
                          </span>
                        </button>
                      ) : user.role === "facility" ? (
                        <button
                          type="button"
                          className={scopeTriggerClass}
                          onClick={() => setScopeUser(user)}
                        >
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-ink-3 hover:text-primary">
                            <Building2 size={11} className="text-ink-4" />
                            {user.facility || "Facility"} · view pages
                          </span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={scopeTriggerClass}
                          onClick={() => setScopeUser(user)}
                        >
                          <Badge variant="primary" className="text-xs cursor-pointer">
                            {user.permissions?.length ?? 0} / {ALL_PERMISSIONS.length} permissions
                          </Badge>
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={user.status === "active" ? "accent" : "neutral"}
                        className="uppercase font-semibold"
                      >
                        {user.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-ink-4">{user.lastLogin}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {user.id !== "LOGISS-882" && (
                        <button
                          type="button"
                          onClick={() =>
                            user.status === "active" ? onRevokeAccess(user) : onRestoreAccess(user)
                          }
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all border shadow-2xs ${
                            user.status === "active"
                              ? "bg-urgent/10 text-urgent border-urgent/30 hover:bg-urgent hover:text-white"
                              : "bg-accent/10 text-accent border-accent/30 hover:bg-accent hover:text-white"
                          }`}
                        >
                          {user.status === "active" ? "Revoke Access" : "Restore Access"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {scopeUser ? <AccessScopeModal user={scopeUser} onClose={() => setScopeUser(null)} /> : null}
    </>
  );
};
