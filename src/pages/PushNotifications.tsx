import { useState } from 'react';
import { Send, Users, User, Clock, CheckCircle2, Trash2, Building2, ShieldCheck, Headset, ShieldAlert } from 'lucide-react';
import { Card, Button, Badge } from '@/shared/components/ui';
import { toast } from 'react-hot-toast';
import { drivers, riders, mockUsers } from '@/data/mockData';
import { pushNotification } from '@/hooks/useNotifications';

// Audiences a super-admin can broadcast to — rider/driver mobile apps + internal staff.
const activeStaff = (mockUsers || []).filter((u: any) => u.status === 'active');
const AUDIENCES = [
  { id: 'all_drivers', label: 'All Drivers', icon: Users, channel: 'Driver app', count: (drivers || []).length },
  { id: 'all_riders', label: 'All Riders', icon: User, channel: 'Rider app', count: (riders || []).length },
  { id: 'dispatchers', label: 'Dispatchers', icon: Headset, channel: 'Dashboard', count: activeStaff.filter((u: any) => u.role === 'dispatcher').length },
  { id: 'facility_users', label: 'Facility Users', icon: Building2, channel: 'Dashboard', count: activeStaff.filter((u: any) => u.role === 'facility').length },
  { id: 'all_staff', label: 'All Staff', icon: ShieldCheck, channel: 'Dashboard', count: activeStaff.length },
];

interface SentLog {
  id: number;
  audienceLabel: string;
  title: string;
  message: string;
  sentAt: string;
  recipients: number;
}

const MOCK_LOGS: SentLog[] = [
  {
    id: 1,
    audienceLabel: 'All Drivers',
    title: 'Route Update: I-95 Closure',
    message: 'I-95 northbound closed between exits 74-78. Please use alternate routes.',
    sentAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    recipients: 12,
  },
  {
    id: 2,
    audienceLabel: 'All Riders',
    title: 'Service Reminder',
    message: 'Please be ready at your pickup location 5 minutes before your scheduled time.',
    sentAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    recipients: 47,
  },
];

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const PushNotifications = ({ role }: { role?: string | null }) => {
  const [audience, setAudience] = useState<string>('all_drivers');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [logs, setLogs] = useState<SentLog[]>(MOCK_LOGS);

  const selected = AUDIENCES.find(a => a.id === audience) || AUDIENCES[0];

  // Only the super-admin can broadcast push notifications.
  if (role && role !== 'admin') {
    return (
      <div className="max-w-md mx-auto mt-24 text-center">
        <div className="w-14 h-14 rounded-2xl bg-urgent/10 flex items-center justify-center mx-auto mb-4"><ShieldAlert size={26} className="text-urgent" /></div>
        <h1 className="text-lg font-semibold text-ink">Restricted</h1>
        <p className="text-sm text-ink-4 mt-1">Push notifications can only be sent by a Super Admin.</p>
      </div>
    );
  }

  const handleSend = () => {
    if (!title.trim() || !message.trim()) {
      toast.error('Please enter a title and message.');
      return;
    }
    setIsSending(true);
    const sentAt = new Date().toISOString();
    setTimeout(() => {
      setLogs(prev => [{
        id: Date.now(),
        audienceLabel: selected.label,
        title: title.trim(),
        message: message.trim(),
        sentAt,
        recipients: selected.count,
      }, ...prev]);
      // Deliver into the in-app feed for dashboard audiences (drivers/riders get it on
      // their mobile apps). It shows up under the bell and persists across reloads.
      if (['dispatchers', 'facility_users', 'all_staff'].includes(selected.id)) {
        pushNotification({
          type: 'info',
          category: 'Broadcast',
          title: title.trim(),
          message: message.trim(),
          time: sentAt,
          action: null,
          audience: selected.label,
        });
      }
      setTitle('');
      setMessage('');
      setIsSending(false);
      toast.success(`Push sent to ${selected.label}`);
    }, 1200);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-400 pb-12">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Push Notifications</h1>
          <p className="text-sm text-ink-4 mt-1">Broadcast real-time alerts to rider/driver apps or internal staff</p>
        </div>
        <Badge variant="primary" className="text-[10px] whitespace-nowrap mt-1"><ShieldCheck size={11} className="inline mr-1" />Super Admin</Badge>
      </div>

      {/* Compose Card */}
      <Card className="p-6 border-line-2 shadow-sm space-y-4">
        {/* Audience selection */}
        <div>
          <p className="text-xs font-semibold text-ink-4 mb-2">Audience</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {AUDIENCES.map(a => {
              const on = audience === a.id;
              return (
                <button
                  key={a.id}
                  onClick={() => setAudience(a.id)}
                  className={`text-left p-3 rounded-xl border-2 transition-all ${on ? 'border-primary bg-primary-tint/20' : 'border-line-2 bg-bg hover:border-primary/40'}`}
                >
                  <a.icon size={16} className={on ? 'text-primary' : 'text-ink-4'} />
                  <p className={`text-xs font-semibold mt-1.5 ${on ? 'text-primary' : 'text-ink'}`}>{a.label}</p>
                  <p className="text-[10px] text-ink-4 mt-0.5">{a.count} · {a.channel}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Notification title..."
          className="w-full text-sm font-semibold text-ink border border-line-2 rounded-xl px-4 py-3 bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
        />

        {/* Message */}
        <div>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value.slice(0, 200))}
            placeholder="Write your message..."
            rows={3}
            className="w-full text-sm text-ink border border-line-2 rounded-xl px-4 py-3 bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all resize-none"
          />
          <p className="text-[11px] text-ink-4 text-right mt-1">{message.length}/200</p>
        </div>

        {/* Send */}
        <Button
          variant="primary"
          icon={isSending ? undefined : Send}
          onClick={handleSend}
          disabled={isSending || !title.trim() || !message.trim()}
          className="w-full justify-center"
        >
          {isSending ? 'Sending...' : `Send to ${selected.label} (${selected.count})`}
        </Button>
      </Card>

      {/* Sent Log */}
      {logs.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-ink-4 uppercase tracking-widest px-1">Sent History</p>
          <div className="space-y-2">
            {logs.map(log => (
              <div key={log.id} className="group flex items-start gap-3 px-4 py-3.5 rounded-2xl border border-line-2 bg-white hover:bg-bg transition-all">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  {log.audienceLabel.includes('Driver') ? <Users size={14} className="text-primary" />
                    : log.audienceLabel.includes('Rider') ? <User size={14} className="text-primary" />
                    : log.audienceLabel.includes('Facility') ? <Building2 size={14} className="text-primary" />
                    : log.audienceLabel.includes('Dispatcher') ? <Headset size={14} className="text-primary" />
                    : <ShieldCheck size={14} className="text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-ink truncate">{log.title}</p>
                    <span className="text-[11px] text-ink-4 shrink-0">{timeAgo(log.sentAt)}</span>
                  </div>
                  <p className="text-xs text-ink-4 line-clamp-1 mb-1.5">{log.message}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-semibold text-ink-3">{log.audienceLabel}</span>
                    <span className="flex items-center gap-1 text-[10px] text-accent">
                      <CheckCircle2 size={10} /> {log.recipients} delivered
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-ink-4">
                      <Clock size={10} /> {new Date(log.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setLogs(prev => prev.filter(l => l.id !== log.id))}
                  className="p-1.5 text-ink-4 hover:text-urgent hover:bg-urgent/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PushNotifications;
