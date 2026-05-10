import { useState } from 'react';
import {
  Bell, Shield, MapPin, Phone, Lock,
  Key, Smartphone, AlertTriangle,
  FileCheck, Activity, Truck, CreditCard,
  BellOff, CheckCircle2, Loader2, Eye, EyeOff,
} from 'lucide-react';
import { Card, Badge, Button } from '../components/ui';

// ─── Toggle Row ────────────────────────────────
const ToggleRow = ({ label, desc, on, onChange }: { label: string; desc: string; on: boolean; onChange: (val: boolean) => void }) => (
  <div className="flex items-center justify-between py-3.5 border-b border-line-2 last:border-0">
    <div className="pr-6 min-w-0">
      <p className="text-sm font-semibold text-ink">{label}</p>
      <p className="text-xs text-ink-4 mt-0.5">{desc}</p>
    </div>
    <button
      onClick={() => onChange(!on)}
      aria-pressed={on}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 ${on ? 'bg-primary' : 'bg-line'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${on ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  </div>
);

// ─── Password Field ────────────────────────────
const PwField = ({ label, placeholder, value, onChange }: { label: string; placeholder: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => {
  const [show, setShow] = useState(false);
  return (
    <div>
      <p className="text-xs font-semibold text-ink-4 mb-1.5">{label}</p>
      <div className="relative">
        <Key size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-4 pointer-events-none" />
        <input
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="w-full h-11 rounded-xl border border-line-2 text-sm font-medium text-ink bg-bg pl-10 pr-11 focus:outline-none focus:border-primary/30 focus:bg-white transition-all"
        />
        <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-4 hover:text-ink transition-colors">
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </div>
  );
};

// ─── County list ───────────────────────────────
const COUNTIES = ['Chesterfield', 'Henrico', 'Hanover', 'Richmond City', 'Powhatan', 'Goochland'];

// ─── Notification groups ───────────────────────
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

// ─── Main Component ────────────────────────────
const Settings = ({ role }: { role?: string | null }) => {
  const [tab, setTab] = useState('security');

  // Security state
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwState, setPwState] = useState<string | null>(null);
  const [pwErr, setPwErr] = useState('');

  // Notifications state
  const [notifs, setNotifs] = useState(NOTIF_DEFAULTS);

  // General save
  const [saved, setSaved] = useState(false);
  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const toggleNotif = (gi: number, id: string) =>
    setNotifs(prev => prev.map((g, i) =>
      i !== gi ? g : { ...g, items: g.items.map(it => it.id === id ? { ...it, on: !it.on } : it) }
    ));
  const muteAll = () => setNotifs(prev => prev.map(g => ({ ...g, items: g.items.map(it => ({ ...it, on: false })) })));

  const handlePasswordSave = (e: React.FormEvent) => {
    e.preventDefault();
    setPwErr('');
    if (!pw.current) { setPwErr('Enter your current password.'); return; }
    if (pw.next.length < 8) { setPwErr('New password must be at least 8 characters.'); return; }
    if (pw.next !== pw.confirm) { setPwErr('New passwords do not match.'); return; }
    setPwState('saving');
    setTimeout(() => {
      setPwState('ok');
      setPw({ current: '', next: '', confirm: '' });
      setTimeout(() => setPwState(null), 3000);
    }, 1000);
  };

  const TABS = [
    { id: 'security', label: 'Security & Privacy', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'coverage', label: 'Service Coverage', icon: MapPin },
    { id: 'contacts', label: 'Emergency Contacts', icon: Phone },
  ];

  return (
    <div className="max-w-4xl mx-auto pb-16 animate-in fade-in duration-300">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-display text-ink tracking-tight">System Settings</h1>
          <p className="text-ink-3 font-semibold mt-1 tracking-tight">Security, notifications, and operational preferences</p>
        </div>
        <Button variant="primary" onClick={handleSave}>
          {saved ? <><CheckCircle2 size={14} className="inline mr-1.5" />Saved</> : 'Save Changes'}
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">

        {/* Sidebar Nav */}
        <nav className="lg:w-52 flex flex-row lg:flex-col gap-1 shrink-0">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all text-left w-full ${tab === t.id ? 'bg-primary text-white' : 'text-ink-3 hover:bg-bg hover:text-ink'
                }`}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
          {/* Sign Out at bottom of nav */}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">

          {/* ── SECURITY ─────────────────────────────── */}
          {tab === 'security' && (
            <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-200">
              {/* Change Password */}
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 bg-accent-light rounded-xl flex items-center justify-center text-accent shrink-0">
                    <Key size={17} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-ink">Change Password</p>
                    <p className="text-xs text-ink-4 mt-0.5">Last changed 4 months ago</p>
                  </div>
                </div>
                <form onSubmit={handlePasswordSave} className="space-y-4">
                  <PwField label="Current Password" placeholder="Enter current password" value={pw.current} onChange={e => setPw(f => ({ ...f, current: e.target.value }))} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <PwField label="New Password" placeholder="At least 8 characters" value={pw.next} onChange={e => setPw(f => ({ ...f, next: e.target.value }))} />
                    <PwField label="Confirm New Password" placeholder="Repeat new password" value={pw.confirm} onChange={e => setPw(f => ({ ...f, confirm: e.target.value }))} />
                  </div>
                  {pwErr && (
                    <div className="flex items-center gap-2 text-xs font-semibold text-urgent bg-urgent-light/50 p-3 rounded-xl border border-urgent/10">
                      <AlertTriangle size={13} /> {pwErr}
                    </div>
                  )}
                  {pwState === 'ok' && (
                    <div className="flex items-center gap-2 text-xs font-semibold text-accent bg-accent-light p-3 rounded-xl border border-accent/10">
                      <CheckCircle2 size={13} /> Password updated successfully.
                    </div>
                  )}
                  <div className="flex justify-end">
                    <Button type="submit" variant="primary" disabled={pwState === 'saving'}>
                      {pwState === 'saving' ? <><Loader2 size={14} className="animate-spin inline mr-1.5" />Updating…</> : 'Update Password'}
                    </Button>
                  </div>
                </form>
              </Card>

              {/* 2FA */}
              <Card className="p-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-primary-light rounded-xl flex items-center justify-center text-primary shrink-0">
                    <Smartphone size={17} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-ink">Two-Factor Authentication</p>
                    <p className="text-xs text-ink-4 mt-0.5">Not enabled — recommended for your account</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="shrink-0">Enable</Button>
              </Card>

              {/* Notice */}
              <div className="flex items-start gap-3 p-4 bg-urgent-light/40 rounded-xl border border-urgent/10">
                <AlertTriangle size={14} className="text-urgent mt-0.5 shrink-0" />
                <p className="text-xs text-urgent/80 font-medium leading-relaxed">
                  Always sign out from shared or public devices. Every login from a new IP address is logged automatically.
                </p>
              </div>
            </div>
          )}

          {/* ── NOTIFICATIONS ────────────────────────── */}
          {tab === 'notifications' && (
            <div className="animate-in slide-in-from-bottom-2 duration-200">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <p className="text-xs font-bold text-ink-4">Notification Preferences</p>
                  <button onClick={muteAll} className="text-xs font-bold text-ink-4 hover:text-urgent flex items-center gap-1.5 transition-colors">
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
                        <p className="text-sm font-bold text-ink">{group.label}</p>
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
                  <Button variant="primary" onClick={handleSave}>Save Preferences</Button>
                </div>
              </Card>
            </div>
          )}

          {/* ── SERVICE COVERAGE ─────────────────────── */}
          {tab === 'coverage' && (
            <div className="animate-in slide-in-from-bottom-2 duration-200">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <p className="text-xs font-bold text-ink-4">Active Service Counties</p>
                  <Badge variant="accent" dot>{COUNTIES.length} Active</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {COUNTIES.map(c => (
                    <span key={c} className="flex items-center gap-1.5 px-3 py-1.5 bg-bg rounded-full border border-line-2 text-xs font-semibold text-ink-2">
                      <MapPin size={11} className="text-ink-4" /> {c}
                    </span>
                  ))}
                  {role === 'admin' && (
                    <button className="flex items-center gap-1 px-3 py-1.5 border border-dashed border-line rounded-full text-xs font-bold text-ink-4 hover:text-primary hover:border-primary/40 transition-colors">
                      + Add County
                    </button>
                  )}
                </div>
                <p className="text-xs text-ink-4 mt-5 flex items-center gap-1.5">
                  <Shield size={11} /> {role === 'admin' ? 'Contact support to modify coverage zones.' : 'Contact your administrator to change service coverage.'}
                </p>
              </Card>
            </div>
          )}

          {/* ── DISPLAY PREFERENCES ──────────────────── */}
          {tab === 'display' && (
            <div className="animate-in slide-in-from-bottom-2 duration-200">
              <Card className="p-6">
                <p className="text-xs font-bold text-ink-4 mb-5">Display Preferences</p>
                <div className="space-y-0">
                  {[
                    { label: 'Time Format', value: '12-hour (AM/PM)', sub: 'How times appear in trip cards and schedules' },
                    { label: 'Date Format', value: 'MM/DD/YYYY', sub: 'Date display across the platform' },
                    { label: 'Distance Unit', value: 'Miles (mi)', sub: 'Used in trip distance and mileage fields' },
                    { label: 'Timezone', value: 'Eastern Time (ET)', sub: 'All times shown in this timezone' },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between py-4 border-b border-line-2 last:border-0">
                      <div>
                        <p className="text-sm font-semibold text-ink">{row.label}</p>
                        <p className="text-xs text-ink-4 mt-0.5">{row.sub}</p>
                      </div>
                      <button className="text-sm font-bold text-primary hover:opacity-70 transition-opacity">{row.value} ›</button>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* ── EMERGENCY CONTACTS ───────────────────── */}
          {tab === 'contacts' && (
            <div className="animate-in slide-in-from-bottom-2 duration-200">
              <Card className="p-8 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-ink tracking-tight">Organization Contact Channels</h3>
                  <p className="text-xs text-ink-4 mt-1 font-medium">Platform-wide support and emergency communication parameters.</p>
                </div>

                <div className="grid grid-cols-1 gap-4 mt-6">
                  <div className="flex items-center gap-5 p-6 bg-urgent-light/40 rounded-3xl border border-urgent/10 group hover:border-urgent/30 transition-all">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-urgent shadow-lg shadow-urgent/10 group-hover:scale-105 transition-transform">
                      <AlertTriangle size={24} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-urgent mb-1">Emergency Operational Hotline</p>
                      <p className="text-xl font-bold text-ink tracking-tight font-mono">(804) 555-9110</p>
                      <p className="text-xs font-bold text-urgent/60 mt-1">Direct Priority Access · 24/7 Monitoring</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-5 p-6 bg-primary-tint/20 rounded-3xl border border-primary/10 group hover:border-primary/30 transition-all">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-primary shadow-lg shadow-primary/10 group-hover:scale-105 transition-transform">
                      <Phone size={24} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-primary mb-1">General Dispatch Control</p>
                      <p className="text-xl font-bold text-ink tracking-tight font-mono">(804) 555-LOGI</p>
                      <p className="text-xs font-bold text-ink-4 mt-1">Standard Operations · 6 AM – 10 PM EST</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-4 p-5 bg-bg rounded-2xl border border-line-2 group hover:bg-white transition-all">
                      <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center text-ink-3 border border-line-2 group-hover:text-primary group-hover:border-primary/20 transition-all">
                        <Bell size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-ink-4">Support Email</p>
                        <p className="text-sm font-bold text-ink truncate">support@loggiskabir.com</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-5 bg-bg rounded-2xl border border-line-2 group hover:bg-white transition-all">
                      <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center text-ink-3 border border-line-2 group-hover:text-primary group-hover:border-primary/20 transition-all">
                        <MapPin size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-ink-4">HQ Address</p>
                        <p className="text-sm font-bold text-ink truncate">Richmond, VA 23230</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-line-2">
                  <p className="text-xs font-bold text-ink-4 text-center italic">
                    These contact parameters are managed globally by Platform Administrators via the CMS.
                  </p>
                </div>
              </Card>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Settings;
