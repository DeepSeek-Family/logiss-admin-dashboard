import { useState } from 'react';
import { Lock, Bell, MapPin, Phone, CheckCircle2 } from 'lucide-react';
import { Button } from '@/shared/components/ui';

import {
  SecurityTab,
  NotificationsTab,
  CoverageTab,
  EmergencyContactsTab
} from '@/features/settings';

const Settings = ({ role }: { role?: string | null }) => {
  const [tab, setTab] = useState('security');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
          <h1 className="type-page-title">System Settings</h1>
          <p className="text-ink-3 font-semibold mt-1 tracking-normal">Security, coverage, and pricing preferences</p>
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
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all text-left w-full ${
                tab === t.id ? 'bg-primary text-white' : 'text-ink-4 hover:bg-bg hover:text-ink'
              }`}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* ── SECURITY ─────────────────────────────── */}
          {tab === 'security' && <SecurityTab />}

          {/* ── NOTIFICATIONS ────────────────────────── */}
          {tab === 'notifications' && <NotificationsTab onSave={handleSave} />}

          {/* ── SERVICE COVERAGE ─────────────────────── */}
          {tab === 'coverage' && <CoverageTab role={role} />}

          {/* ── EMERGENCY CONTACTS ───────────────────── */}
          {tab === 'contacts' && <EmergencyContactsTab />}
        </div>
      </div>
    </div>
  );
};

export default Settings;
