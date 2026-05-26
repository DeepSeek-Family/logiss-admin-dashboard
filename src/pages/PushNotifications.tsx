import { useState } from 'react';
import { Send, Users, User, Clock, CheckCircle2, Trash2 } from 'lucide-react';
import { Card, Button } from '@/shared/components/ui';
import { toast } from 'react-hot-toast';

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

const PushNotifications = () => {
  const [audience, setAudience] = useState<'all_drivers' | 'all_riders'>('all_drivers');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [logs, setLogs] = useState<SentLog[]>(MOCK_LOGS);

  const handleSend = () => {
    if (!title.trim() || !message.trim()) {
      toast.error('Please enter a title and message.');
      return;
    }
    setIsSending(true);
    setTimeout(() => {
      setLogs(prev => [{
        id: Date.now(),
        audienceLabel: audience === 'all_drivers' ? 'All Drivers' : 'All Riders',
        title: title.trim(),
        message: message.trim(),
        sentAt: new Date().toISOString(),
        recipients: audience === 'all_drivers' ? 12 : 47,
      }, ...prev]);
      setTitle('');
      setMessage('');
      setIsSending(false);
      toast.success('Push notification sent!');
    }, 1200);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-400 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-ink">Push Notifications</h1>
        <p className="text-sm text-ink-4 mt-1">Send real-time alerts to driver or rider mobile apps</p>
      </div>

      {/* Compose Card */}
      <Card className="p-6 border-line-2 shadow-sm space-y-4">
        {/* Audience toggle */}
        <div className="flex bg-bg p-1 rounded-xl border border-line-2">
          <button
            onClick={() => setAudience('all_drivers')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-lg transition-all ${
              audience === 'all_drivers' ? 'bg-white shadow-sm text-ink border border-line-2' : 'text-ink-4 hover:text-ink'
            }`}
          >
            <Users size={15} /> All Drivers
          </button>
          <button
            onClick={() => setAudience('all_riders')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-lg transition-all ${
              audience === 'all_riders' ? 'bg-white shadow-sm text-ink border border-line-2' : 'text-ink-4 hover:text-ink'
            }`}
          >
            <User size={15} /> All Riders
          </button>
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
          {isSending ? 'Sending...' : `Send to ${audience === 'all_drivers' ? 'All Drivers' : 'All Riders'}`}
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
                  {log.audienceLabel.includes('Driver') ? <Users size={14} className="text-primary" /> : <User size={14} className="text-primary" />}
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
