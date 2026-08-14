import { useState } from 'react';
import { X, Send, Users, User, BellRing, Smartphone, AlertCircle } from 'lucide-react';
import { Button } from '@/shared/components/ui';
import { toast } from 'react-hot-toast';

interface SendBroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SendBroadcastModal = ({ isOpen, onClose }: SendBroadcastModalProps) => {
  const [audience, setAudience] = useState('all_drivers');
  const [priority, setPriority] = useState('standard');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  const handleSend = () => {
    if (!title.trim() || !message.trim()) {
      toast.error('Please enter both a title and a message.');
      return;
    }

    setIsSending(true);

    // Simulate API call
    setTimeout(() => {
      setIsSending(false);
      toast.success('Push notification sent successfully!');
      onClose();
      // Reset form
      setTitle('');
      setMessage('');
      setAudience('all_drivers');
      setPriority('standard');
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-ink/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-line-2 bg-bg relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl"></div>
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Smartphone size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-ink">Send Push Notification</h2>
              <p className="text-xs font-medium text-ink-3 mt-0.5">Broadcast message to mobile apps</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-line-2 hover:bg-line-2 transition-colors text-ink-4 relative z-10"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5">
          
          {/* Audience Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-ink-3 uppercase tracking-wide">Target Audience</label>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setAudience('all_drivers')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${audience === 'all_drivers' ? 'border-primary bg-primary/5' : 'border-line-2 hover:border-primary/30'}`}
              >
                <Users size={18} className={audience === 'all_drivers' ? 'text-primary' : 'text-ink-4'} />
                <span className={`text-xs font-semibold mt-1.5 ${audience === 'all_drivers' ? 'text-primary' : 'text-ink-3'}`}>All Drivers</span>
              </button>
              <button 
                onClick={() => setAudience('all_riders')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${audience === 'all_riders' ? 'border-primary bg-primary/5' : 'border-line-2 hover:border-primary/30'}`}
              >
                <Users size={18} className={audience === 'all_riders' ? 'text-primary' : 'text-ink-4'} />
                <span className={`text-xs font-semibold mt-1.5 ${audience === 'all_riders' ? 'text-primary' : 'text-ink-3'}`}>All Riders</span>
              </button>
              <button 
                onClick={() => setAudience('specific_driver')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${audience === 'specific_driver' ? 'border-primary bg-primary/5' : 'border-line-2 hover:border-primary/30'}`}
              >
                <User size={18} className={audience === 'specific_driver' ? 'text-primary' : 'text-ink-4'} />
                <span className={`text-xs font-semibold mt-1.5 ${audience === 'specific_driver' ? 'text-primary' : 'text-ink-3'}`}>Specific Driver</span>
              </button>
              <button 
                onClick={() => setAudience('specific_rider')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${audience === 'specific_rider' ? 'border-primary bg-primary/5' : 'border-line-2 hover:border-primary/30'}`}
              >
                <User size={18} className={audience === 'specific_rider' ? 'text-primary' : 'text-ink-4'} />
                <span className={`text-xs font-semibold mt-1.5 ${audience === 'specific_rider' ? 'text-primary' : 'text-ink-3'}`}>Specific Rider</span>
              </button>
            </div>
            {(audience === 'specific_driver' || audience === 'specific_rider') && (
              <div className="mt-2 animate-in slide-in-from-top-2">
                <input 
                  type="text" 
                  placeholder={`Search ${audience.split('_')[1]} by name or ID...`}
                  className="w-full text-sm font-medium text-ink border border-line-2 rounded-xl px-4 py-2.5 bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>
            )}
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-ink-3 uppercase tracking-wide">Notification Priority</label>
            <div className="flex bg-bg p-1 rounded-xl border border-line-2">
              <button 
                onClick={() => setPriority('standard')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${priority === 'standard' ? 'bg-white shadow-sm text-ink border border-line-2' : 'text-ink-4 hover:bg-white/50'}`}
              >
                <BellRing size={12} /> Standard
              </button>
              <button 
                onClick={() => setPriority('high')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${priority === 'high' ? 'bg-warning shadow-sm text-white' : 'text-ink-4 hover:bg-white/50'}`}
              >
                <AlertCircle size={12} /> High
              </button>
              <button 
                onClick={() => setPriority('urgent')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${priority === 'urgent' ? 'bg-urgent shadow-sm text-white' : 'text-ink-4 hover:bg-white/50'}`}
              >
                <AlertCircle size={12} /> Urgent
              </button>
            </div>
          </div>

          {/* Message Content */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-ink-3 uppercase tracking-wide">Notification Title</label>
              <input 
                type="text" 
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Inclement Weather Alert"
                className="w-full text-sm font-bold text-ink border border-line-2 rounded-xl px-4 py-2.5 bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-ink-3 uppercase tracking-wide">Message Body</label>
              <textarea 
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Type the message that will appear on their screen..."
                rows={4}
                className="w-full text-sm font-medium text-ink border border-line-2 rounded-xl px-4 py-3 bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all resize-none"
              />
              <p className="text-xs text-ink-4 text-right">{message.length}/200 characters</p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-5 border-t border-line-2 bg-bg flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            variant="primary" 
            icon={isSending ? undefined : Send} 
            onClick={handleSend}
            disabled={isSending || !title.trim() || !message.trim()}
          >
            {isSending ? 'Sending...' : 'Send Push Notification'}
          </Button>
        </div>

      </div>
    </div>
  );
};
