import React from 'react';
import { createPortal } from 'react-dom';
import { Users, Shield, Building2, Check } from 'lucide-react';
import { Button, Badge } from '@/shared/components/ui';
import { PERMISSION_GROUPS, ALL_PERMISSIONS, DEFAULT_DISPATCH_PERMISSIONS, FACILITIES } from '../permissions';

interface InviteData {
  name: string;
  email: string;
  role: string;
  permissions: string[];
  facility?: string;
}

interface InviteUserModalProps {
  inviteData: InviteData;
  setInviteData: (val: InviteData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

const ROLES = [
  { id: 'admin', label: 'Admin', icon: Shield, desc: 'Full system access — no restrictions.' },
  { id: 'dispatcher', label: 'Dispatch', icon: Users, desc: 'Permission-based — pick exactly what they can do.' },
  { id: 'facility', label: 'Facility User', icon: Building2, desc: 'Client-side — only their assigned facility’s data.' },
];

export const InviteUserModal = ({ inviteData, setInviteData, onSubmit, onClose }: InviteUserModalProps) => {
  const perms = inviteData.permissions || [];

  const selectRole = (role: string) => {
    setInviteData({
      ...inviteData,
      role,
      // Seed dispatch with a sensible starter set; clear for others.
      permissions: role === 'dispatcher' ? (perms.length ? perms : [...DEFAULT_DISPATCH_PERMISSIONS]) : [],
      facility: role === 'facility' ? (inviteData.facility || FACILITIES[0]) : undefined,
    });
  };

  const togglePerm = (key: string) => {
    setInviteData({
      ...inviteData,
      permissions: perms.includes(key) ? perms.filter(k => k !== key) : [...perms, key],
    });
  };

  const toggleGroup = (groupKeys: string[]) => {
    const allOn = groupKeys.every(k => perms.includes(k));
    setInviteData({
      ...inviteData,
      permissions: allOn ? perms.filter(k => !groupKeys.includes(k)) : [...new Set([...perms, ...groupKeys])],
    });
  };

  const setAll = (on: boolean) => setInviteData({ ...inviteData, permissions: on ? [...ALL_PERMISSIONS] : [] });

  return createPortal((
    <div className="fixed inset-0 bg-ink/50 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        <div className="px-6 py-5 border-b border-line-2 shrink-0">
          <h3 className="text-xl font-semibold text-ink">Invite New User</h3>
          <p className="text-sm text-ink-3 mt-0.5">Pick a role and (for Dispatch) assign exactly what they can access.</p>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Name + Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-ink-4 mb-1.5">Full Name</label>
                <input
                  type="text" required value={inviteData.name}
                  onChange={e => setInviteData({ ...inviteData, name: e.target.value })}
                  className="w-full bg-bg border border-line rounded-xl px-4 py-2.5 text-sm focus:ring-4 focus:ring-primary/10 outline-none"
                  placeholder="e.g. Jane Doe"
                />
              </div>
              <div>
                <label className="block text-xs text-ink-4 mb-1.5">Email Address</label>
                <input
                  type="email" required value={inviteData.email}
                  onChange={e => setInviteData({ ...inviteData, email: e.target.value })}
                  className="w-full bg-bg border border-line rounded-xl px-4 py-2.5 text-sm focus:ring-4 focus:ring-primary/10 outline-none"
                  placeholder="jane@logiss.com"
                />
              </div>
            </div>

            {/* Role selection */}
            <div>
              <label className="block text-xs text-ink-4 mb-1.5">Role</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {ROLES.map(r => (
                  <button
                    type="button" key={r.id} onClick={() => selectRole(r.id)}
                    className={`text-left p-3 rounded-xl border-2 transition-all ${inviteData.role === r.id ? 'border-primary bg-primary-tint/20' : 'border-line-2 bg-bg hover:border-primary/40'}`}
                  >
                    <r.icon size={18} className={inviteData.role === r.id ? 'text-primary' : 'text-ink-4'} />
                    <p className={`text-xs font-semibold mt-2 ${inviteData.role === r.id ? 'text-primary' : 'text-ink'}`}>{r.label}</p>
                    <p className="text-[10px] text-ink-4 mt-0.5 leading-snug">{r.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Admin note */}
            {inviteData.role === 'admin' && (
              <div className="flex items-center gap-2 text-xs font-medium text-ink-3 bg-primary/5 border border-primary/15 rounded-xl px-4 py-3">
                <Shield size={14} className="text-primary" /> Admins have full, unrestricted access to every module.
              </div>
            )}

            {/* Facility assignment */}
            {inviteData.role === 'facility' && (
              <div>
                <label className="block text-xs text-ink-4 mb-1.5">Assigned Facility / Program</label>
                <select
                  value={inviteData.facility || ''}
                  onChange={e => setInviteData({ ...inviteData, facility: e.target.value })}
                  className="w-full bg-bg border border-line rounded-xl px-4 py-2.5 text-sm focus:ring-4 focus:ring-primary/10 outline-none cursor-pointer"
                >
                  {FACILITIES.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
                <p className="text-[11px] text-ink-4 mt-1.5">This user will only see rides &amp; data for the selected facility.</p>
              </div>
            )}

            {/* Dispatch permission matrix */}
            {inviteData.role === 'dispatcher' && (
              <div className="border border-line-2 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-line-2 bg-bg/40">
                  <div>
                    <p className="text-sm font-semibold text-ink">Permissions</p>
                    <p className="text-[11px] text-ink-4">{perms.length} of {ALL_PERMISSIONS.length} enabled</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setAll(true)} className="text-xs font-semibold text-primary hover:underline">Select all</button>
                    <button type="button" onClick={() => setAll(false)} className="text-xs font-semibold text-ink-4 hover:underline">Clear</button>
                  </div>
                </div>
                <div className="max-h-[40vh] overflow-y-auto divide-y divide-line-2">
                  {PERMISSION_GROUPS.map(g => {
                    const groupKeys = g.perms.map(p => p.key);
                    const allOn = groupKeys.every(k => perms.includes(k));
                    const someOn = groupKeys.some(k => perms.includes(k));
                    return (
                      <div key={g.group} className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-ink-3 uppercase tracking-wide">{g.group}</span>
                          <button
                            type="button" onClick={() => toggleGroup(groupKeys)}
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-all ${allOn ? 'bg-primary text-white border-primary' : someOn ? 'bg-primary/10 text-primary border-primary/20' : 'bg-white text-ink-4 border-line-2 hover:bg-bg'}`}
                          >
                            {allOn ? 'All on' : 'Select group'}
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {g.perms.map(p => {
                            const on = perms.includes(p.key);
                            return (
                              <button
                                type="button" key={p.key} onClick={() => togglePerm(p.key)}
                                className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border text-left transition-all ${on ? 'border-primary/30 bg-primary-tint/20' : 'border-line-2 bg-white hover:bg-bg'}`}
                              >
                                <span className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${on ? 'bg-primary border-primary text-white' : 'border-line-2 bg-white'}`}>
                                  {on && <Check size={11} strokeWidth={3} />}
                                </span>
                                <span className={`text-xs font-medium ${on ? 'text-ink' : 'text-ink-3'}`}>{p.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 px-6 py-4 border-t border-line-2 shrink-0">
            {inviteData.role === 'dispatcher' && <Badge variant="primary" className="text-[10px]">{perms.length} permissions</Badge>}
            <div className="flex gap-3 ml-auto">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" variant="primary">Send Invite</Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  ), document.body);
};
