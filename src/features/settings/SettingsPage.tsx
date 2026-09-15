import { useState } from 'react';
import { Lock, Bell, CheckCircle2 } from 'lucide-react';

import {
  SecurityTab,
  NotificationsTab
} from '@/features/settings';

const Settings = () => {
  const [tab, setTab] = useState('security');
  const [toast, setToast] = useState(false);

  const handleSavePreferences = () => {
    setToast(true);
    setTimeout(() => setToast(false), 3000);
  };


  const TABS = [
    { id: 'security', label: 'Security & Privacy', icon: Lock },
    { id: 'notifications', label: 'Notifications & Alerts', icon: Bell },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto pb-16 px-4 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="type-page-title">System Settings</h1>
          <p className="text-ink-3 font-semibold mt-1 tracking-normal">Security, coverage, and pricing preferences</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Sidebar Nav */}
        <nav className="lg:w-60 w-full flex flex-row lg:flex-col gap-1.5 shrink-0 bg-white p-2.5 rounded-2xl border border-line-2 shadow-sm">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all text-left w-full ${
                tab === t.id ? 'bg-primary text-white shadow-sm' : 'text-ink-3 hover:bg-bg hover:text-ink'
              }`}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0 w-full">
          {/* Toast */}
          {toast && (
            <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-accent text-white px-4 py-2.5 rounded-xl shadow-lg animate-in slide-in-from-bottom-4 duration-300 text-sm font-medium">
              <CheckCircle2 size={15} /> Settings saved successfully
            </div>
          )}

          {/* ── SECURITY ─────────────────────────────── */}
          {tab === 'security' && <SecurityTab />}

          {/* ── NOTIFICATIONS ────────────────────────── */}
          {tab === 'notifications' && <NotificationsTab onSave={handleSavePreferences} />}
        </div>
      </div>
    </div>
  );
};

export default Settings;
