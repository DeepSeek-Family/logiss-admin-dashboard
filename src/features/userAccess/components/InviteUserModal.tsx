import React from 'react';
import { Users, Shield } from 'lucide-react';
import { Button } from '@/shared/components/ui';

interface InviteData {
  name: string;
  email: string;
  role: string;
}

interface InviteUserModalProps {
  inviteData: InviteData;
  setInviteData: (val: InviteData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const InviteUserModal = ({
  inviteData,
  setInviteData,
  onSubmit,
  onClose
}: InviteUserModalProps) => {
  return (
    <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95">
        <h3 className="text-xl font-semibold text-ink mb-1">Invite New User</h3>
        <p className="text-sm text-ink-3 mb-6">Send an invitation link to grant dashboard access.</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-ink-4 mb-1.5">Full Name</label>
            <input
              type="text"
              required
              value={inviteData.name}
              onChange={e => setInviteData({ ...inviteData, name: e.target.value })}
              className="w-full bg-bg border border-line rounded-xl px-4 py-2.5 text-sm focus:ring-4 focus:ring-primary/10 outline-none"
              placeholder="e.g. Jane Doe"
            />
          </div>
          <div>
            <label className="block text-xs text-ink-4 mb-1.5">Email Address</label>
            <input
              type="email"
              required
              value={inviteData.email}
              onChange={e => setInviteData({ ...inviteData, email: e.target.value })}
              className="w-full bg-bg border border-line rounded-xl px-4 py-2.5 text-sm focus:ring-4 focus:ring-primary/10 outline-none"
              placeholder="jane@logiss.com"
            />
          </div>
          <div>
            <label className="block text-xs text-ink-4 mb-1.5">Role Level</label>
            <div className="grid grid-cols-2 gap-3">
              <div
                onClick={() => setInviteData({ ...inviteData, role: 'dispatcher' })}
                className={`cursor-pointer p-3 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${
                  inviteData.role === 'dispatcher'
                    ? 'border-primary bg-primary-light/10 text-primary'
                    : 'border-line-2 bg-bg text-ink-3 hover:border-primary/50'
                }`}
              >
                <Users size={20} />
                <span className="text-xs font-medium">Dispatcher</span>
              </div>
              <div
                onClick={() => setInviteData({ ...inviteData, role: 'admin' })}
                className={`cursor-pointer p-3 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${
                  inviteData.role === 'admin'
                    ? 'border-primary bg-primary-light/10 text-primary'
                    : 'border-line-2 bg-bg text-ink-3 hover:border-primary/50'
                }`}
              >
                <Shield size={20} />
                <span className="text-xs font-medium">Admin</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 mt-2 border-t border-line-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary" className="flex-1">Send Invite</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
