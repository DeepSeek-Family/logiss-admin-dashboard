import { useState } from 'react';
import { Truck, Activity, FileCheck, CreditCard, BellOff } from 'lucide-react';
import { Card, Button } from '@/shared/components/ui';
import { ToggleRow } from './ToggleRow';

const NOTIF_DEFAULTS = [
  {
    label: 'Trip Alerts', icon: Truck, color: 'bg-primary-light text-primary',
    items: [
      { id: 'new_booking', label: 'New Booking Request', desc: 'Trip submitted for dispatch review', on: true },
      { id: 'trip_assigned', label: 'Trip Assigned to Driver', desc: 'Dispatch assigns a trip to a driver', on: true },
      { id: 'no_show', label: 'Rider No-Show Alert', desc: 'Driver reports a passenger no-show', on: true },
    ],
  },
  {
    label: 'Live Operations', icon: Activity, color: 'bg-accent-light text-accent',
    items: [
      { id: 'driver_late', label: 'Driver Running Late', desc: 'ETA delay exceeds 10 minutes', on: true },
      { id: 'will_call', label: 'Will Call Ready', desc: 'Rider calls in for return pickup', on: true },
      { id: 'sos', label: 'SOS / Emergency Alert', desc: 'Critical safety alert from the field', on: true },
    ],
  },
  {
    label: 'Compliance', icon: FileCheck, color: 'bg-warning/10 text-warning',
    items: [
      { id: 'doc_expiring', label: 'Document Expiring Soon', desc: 'License or insurance expiring in 30 days', on: true },
      { id: 'doc_expired', label: 'Document Expired', desc: 'Critical compliance document has expired', on: true },
    ],
  },
  {
    label: 'Financial', icon: CreditCard, color: 'bg-purple-50 text-purple-500',
    items: [
      { id: 'payment_fail', label: 'Payment Failed', desc: 'Rider payment authorization failed', on: true },
      { id: 'daily_summary', label: 'Daily Revenue Summary', desc: 'End-of-day email report at 6:00 PM', on: false },
    ],
  },
];

interface NotificationsTabProps {
  onSave: () => void;
}

export const NotificationsTab = ({ onSave }: NotificationsTabProps) => {
  const [notifs, setNotifs] = useState(NOTIF_DEFAULTS);

  const toggleNotif = (gi: number, id: string) =>
    setNotifs(prev => prev.map((g, i) =>
      i !== gi ? g : { ...g, items: g.items.map(it => it.id === id ? { ...it, on: !it.on } : it) }
    ));
  
  const muteAll = () => setNotifs(prev => prev.map(g => ({ ...g, items: g.items.map(it => ({ ...it, on: false })) })));

  return (
    <div className="animate-in slide-in-from-bottom-2 duration-200">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <p className="text-xs text-ink-4">Notification Preferences</p>
          <button onClick={muteAll} className="text-xs text-ink-4 hover:text-urgent flex items-center gap-1.5 transition-colors">
            <BellOff size={12} /> Mute all
          </button>
        </div>
        <div className="space-y-7">
          {notifs.map((group, gi) => (
            <div key={group.label}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${group.color}`}>
                  <group.icon size={12} />
                </div>
                <p className="text-sm font-medium text-ink">{group.label}</p>
              </div>
              <div className="pl-8">
                {group.items.map(item => (
                  <ToggleRow
                    key={item.id}
                    label={item.label}
                    desc={item.desc}
                    on={item.on}
                    onChange={() => toggleNotif(gi, item.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 pt-5 border-t border-line-2 flex justify-end">
          <Button variant="primary" onClick={onSave}>Save Preferences</Button>
        </div>
      </Card>
    </div>
  );
};
