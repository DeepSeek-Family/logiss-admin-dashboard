import { useState, useMemo } from 'react';
import { Send, Users, User, Clock, CheckCircle2, Building2, ShieldCheck, Headset, ShieldAlert, Loader2 } from 'lucide-react';
import { Card, Button, Badge } from '@/shared/components/ui';
import { toast } from 'react-hot-toast';
import { pushNotification } from '@/hooks/useNotifications';
import { useSendPushNotificationMutation } from '@/redux/api/pushNotificationsApi';
import { useGetNotificationsQuery } from '@/redux/api/notificationsApi';
import { useGetRidersQuery } from '@/redux/api/ridersApi';
import { useGetDriversQuery } from '@/redux/api/driversApi';

interface SentLog {
  id: string;
  audienceLabel: string;
  title: string;
  message: string;
  sentAt: string;
  recipients: number;
}

const audienceLabelFromApi = (audience?: string) => {
  const a = String(audience || '').toUpperCase();
  if (a === 'DRIVER') return 'All Drivers';
  if (a === 'USER') return 'All Riders';
  if (a === 'ALL') return 'All (Riders & Drivers)';
  return audience || 'Broadcast';
};

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const PushNotifications = ({ role }: { role?: string | null }) => {
  const { data: driversResponse } = useGetDriversQuery();
  const { data: ridersResponse } = useGetRidersQuery();
  const { data: notificationsResponse, isLoading: logsLoading, refetch: refetchLogs } = useGetNotificationsQuery({
    page: 1,
    limit: 50,
  });

  const driversCount = driversResponse?.data?.length || 0;
  const ridersCount = ridersResponse?.data?.length || 0;

  const AUDIENCES = useMemo(() => [
    { id: 'all_riders', apiAudience: 'USER', label: 'All Riders', icon: User, channel: 'Rider app', count: ridersCount },
    { id: 'all_drivers', apiAudience: 'DRIVER', label: 'All Drivers', icon: Users, channel: 'Driver app', count: driversCount },
    { id: 'all', apiAudience: 'ALL', label: 'All (Riders & Drivers)', icon: ShieldCheck, channel: 'All Apps', count: driversCount + ridersCount },
    { id: 'dispatchers', apiAudience: 'USER', label: 'Dispatchers', icon: Headset, channel: 'Dashboard', count: 1 },
    { id: 'facility_users', apiAudience: 'USER', label: 'Facility Users', icon: Building2, channel: 'Dashboard', count: 1 },
  ], [driversCount, ridersCount]);

  const [audience, setAudience] = useState<string>('all_riders');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sendPushNotification, { isLoading: isSending }] = useSendPushNotificationMutation();

  const logs: SentLog[] = useMemo(
    () =>
      (notificationsResponse?.data || []).map((n) => ({
        id: n._id,
        audienceLabel: audienceLabelFromApi(n.audience),
        title: n.title || n.text || 'Notification',
        message: n.message || n.text || '',
        sentAt: n.createdAt || n.updatedAt || new Date().toISOString(),
        recipients: 0,
      })),
    [notificationsResponse]
  );

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

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error('Please enter a title and message.');
      return;
    }

    const sentAt = new Date().toISOString();

    try {
      await sendPushNotification({
        title: title.trim(),
        description: message.trim(),
        audience: selected.apiAudience || 'ALL',
      }).unwrap();

      refetchLogs();

      if (['dispatchers', 'facility_users'].includes(selected.id)) {
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
      toast.success(`Push sent to ${selected.label}`);
    } catch (err: any) {
      toast.error(err?.data?.message || err?.error || 'Failed to send notification');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-400 pb-12">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="type-page-title">Push Notifications</h1>
          <p className="text-sm text-ink-4 mt-1">Broadcast real-time alerts to rider/driver apps or internal staff</p>
        </div>
        <Badge variant="primary" className="text-xs whitespace-nowrap mt-1"><ShieldCheck size={11} className="inline mr-1" />Super Admin</Badge>
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
                  <p className="text-xs text-ink-4 mt-0.5">{a.count} · {a.channel}</p>
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
          <p className="text-xs text-ink-4 text-right mt-1">{message.length}/200</p>
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
      {(logsLoading || logs.length > 0) && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-ink-4 uppercase tracking-widest px-1">Sent History</p>
          {logsLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-ink-4">
              <Loader2 size={18} className="animate-spin text-primary" />
              Loading history…
            </div>
          ) : (
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
                    <span className="text-xs text-ink-4 shrink-0">{timeAgo(log.sentAt)}</span>
                  </div>
                  <p className="text-xs text-ink-4 line-clamp-1 mb-1.5">{log.message}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-ink-3">{log.audienceLabel}</span>
                    {log.recipients > 0 && (
                      <span className="flex items-center gap-1 text-xs text-accent">
                        <CheckCircle2 size={10} /> {log.recipients} delivered
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-xs text-ink-4">
                      <Clock size={10} /> {new Date(log.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PushNotifications;
