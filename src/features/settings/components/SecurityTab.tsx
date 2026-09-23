import React, { useState } from 'react';
import { Key, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { Card, Button } from '@/shared/components/ui';
import { PwField } from './PwField';
import { useChangePasswordMutation } from '@/redux/api/authApi';
import { apiErrorMessage } from '@/features/bookings/utils/helpers';

export const SecurityTab = () => {
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwOk, setPwOk] = useState(false);
  const [pwErr, setPwErr] = useState('');
  const [changePassword, { isLoading }] = useChangePasswordMutation();

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwErr('');
    setPwOk(false);

    if (!pw.current.trim()) {
      setPwErr('Enter your current password.');
      return;
    }
    if (pw.next.length < 8) {
      setPwErr('New password must be at least 8 characters.');
      return;
    }
    if (pw.next !== pw.confirm) {
      setPwErr('New passwords do not match.');
      return;
    }

    try {
      await changePassword({
        currentPassword: pw.current,
        newPassword: pw.next,
        confirmPassword: pw.confirm,
      }).unwrap();
      setPw({ current: '', next: '', confirm: '' });
      setPwOk(true);
      setTimeout(() => setPwOk(false), 3000);
    } catch (err) {
      setPwErr(apiErrorMessage(err, 'Failed to update password'));
    }
  };

  return (
    <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-200">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 bg-accent-light rounded-xl flex items-center justify-center text-accent shrink-0">
            <Key size={17} />
          </div>
          <div>
            <p className="text-sm font-medium text-ink">Change Password</p>
            <p className="text-xs text-ink-4 mt-0.5">Use a strong password you do not use elsewhere</p>
          </div>
        </div>
        <form onSubmit={handlePasswordSave} className="space-y-4">
          <PwField
            label="Current Password"
            placeholder="Enter current password"
            value={pw.current}
            onChange={e => setPw(f => ({ ...f, current: e.target.value }))}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <PwField
              label="New Password"
              placeholder="At least 8 characters"
              value={pw.next}
              onChange={e => setPw(f => ({ ...f, next: e.target.value }))}
            />
            <PwField
              label="Confirm New Password"
              placeholder="Repeat new password"
              value={pw.confirm}
              onChange={e => setPw(f => ({ ...f, confirm: e.target.value }))}
            />
          </div>
          {pwErr && (
            <div className="flex items-center gap-2 text-xs font-semibold text-urgent bg-urgent-light/50 p-3 rounded-xl border border-urgent/10">
              <AlertTriangle size={13} /> {pwErr}
            </div>
          )}
          {pwOk && (
            <div className="flex items-center gap-2 text-xs font-semibold text-accent bg-accent-light p-3 rounded-xl border border-accent/10">
              <CheckCircle2 size={13} /> Password updated successfully.
            </div>
          )}
          <div className="flex justify-end">
            <Button type="submit" variant="primary" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin inline mr-1.5" />
                  Updating…
                </>
              ) : (
                'Update Password'
              )}
            </Button>
          </div>
        </form>
      </Card>

      <div className="flex items-start gap-3 p-4 bg-urgent-light/40 rounded-xl border border-urgent/10">
        <AlertTriangle size={14} className="text-urgent mt-0.5 shrink-0" />
        <p className="text-xs text-urgent/80 font-medium leading-relaxed">
          Always sign out from shared or public devices. Every login from a new IP address is logged automatically.
        </p>
      </div>
    </div>
  );
};
