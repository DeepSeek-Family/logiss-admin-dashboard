import React from 'react';
import { X, Phone, Mail, AlertTriangle, MessageSquare, Star } from 'lucide-react';
import { Avatar, Badge, Button } from '@/shared/components/ui';

interface LiveTripRiderProfileProps {
  profile: any;
  onClose: () => void;
}

export const LiveTripRiderProfile: React.FC<LiveTripRiderProfileProps> = ({ profile, onClose }) => {
  if (!profile) return null;

  return (
    <div className="fixed inset-0 z-[300] flex justify-end">
      <div className="absolute inset-0 bg-ink/20 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl border-l border-line-2 flex flex-col animate-in slide-in-from-right duration-300">
        <div className="px-6 py-5 border-b border-line-2 flex items-center justify-between">
          <h3 className="text-base font-semibold text-ink">Rider Profile</h3>
          <button onClick={onClose} className="p-2 hover:bg-bg rounded-xl text-ink-4"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <div className="flex flex-col items-center text-center">
            <Avatar initials={profile.initials} size="lg" className="ring-4 ring-bg shadow-xl mb-4" />
            <h4 className="text-xl font-semibold text-ink leading-tight">{profile.name}</h4>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-ink-4">{profile.id || 'RID-2024-8821'}</span>
              <Badge variant="accent" dot>Active</Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-bg rounded-xl border border-line-2">
              <p className="text-xs text-ink-4 uppercase mb-1">Mobility</p>
              <p className="text-sm font-medium text-primary">{profile.mobility || 'Ambulatory'}</p>
            </div>
            <div className="p-4 bg-bg rounded-xl border border-line-2">
              <p className="text-xs text-ink-4 uppercase mb-1">Rating</p>
              <p className="text-sm font-medium text-warning flex items-center gap-1"><Star size={12} fill="currentColor" /> {profile.rating || 4.9}</p>
            </div>
          </div>

          <section className="space-y-3">
            <h5 className="type-th px-1">Contact Details</h5>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 bg-bg rounded-xl border border-line-2">
                <Phone size={14} className="text-ink-4" />
                <span className="text-sm font-medium text-ink">{profile.phone || '(804) 555-0142'}</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-bg rounded-xl border border-line-2">
                <Mail size={14} className="text-ink-4" />
                <span className="text-sm font-medium text-ink truncate">{profile.email || 'margaret.t@example.com'}</span>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h5 className="type-th px-1">Emergency Contact</h5>
            <div className="flex items-center gap-3 p-3 bg-bg rounded-xl border border-line-2">
              <div className="w-8 h-8 bg-urgent-light text-urgent rounded-lg flex items-center justify-center shrink-0">
                <AlertTriangle size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-ink truncate">{profile.emergencyContact?.name || 'Sarah Phillips'}</p>
                  <span className="text-xs text-ink-4 uppercase">{profile.emergencyContact?.relation || 'Daughter'}</span>
                </div>
                <p className="text-xs font-medium text-primary">{profile.emergencyContact?.phone || '(804) 555-9921'}</p>
              </div>
            </div>
          </section>
        </div>
        <div className="p-6 border-t border-line-2 flex gap-3 bg-bg/30">
          <Button variant="primary" className="flex-1" icon={Phone}>Call Rider</Button>
          <Button variant="outline" className="flex-1" icon={MessageSquare}>Message</Button>
        </div>
      </div>
    </div>
  );
};
