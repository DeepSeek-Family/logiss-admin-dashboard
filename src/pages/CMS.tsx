import { useState } from 'react';
import {
  FileText,
  Shield,
  HelpCircle,
  Info,
  Save,
  RotateCcw,
  Clock,
  ExternalLink,
  Edit3,
  CheckCircle,
  ChevronRight,
  Loader2,
  Building2,
  Phone,
  Mail,
  MapPin,
  Smartphone
} from 'lucide-react';
import { Card, Button, Badge } from '../components/ui';

interface ContentState {
  [key: string]: string;
}

interface OrgSettings {
  name: string;
  supportEmail: string;
  emergencyPhone: string;
  generalPhone: string;
  address: string;
  timezone: string;
  status: string;
}

const CMS = ({ role }: { role?: string | null }) => {
  const [activePage, setActivePage] = useState('org');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [content, setContent] = useState<ContentState>({
    terms: `1. Acceptance of Terms\nBy using LOGISS, you agree to these terms...\n\n2. Dispatcher Responsibility\nDispatchers must verify all medical requirements before assignment...`,
    privacy: `Your privacy is important to us. This policy explains how we collect and use your data to provide medical transportation services...`,
    faq: `Q: How to reset dispatcher password?\nA: Go to Security settings...\n\nQ: What is a Will-Call trip?\nA: A trip where the return time is not fixed...`,
    about: `LOGISS is a premier medical transportation management platform...`
  });

  const [orgSettings, setOrgSettings] = useState<OrgSettings>({
    name: 'Loggiskabir Dispatch Center',
    supportEmail: 'support@logiss.com',
    emergencyPhone: '(804) 555-LOGI',
    generalPhone: '(804) 555-DISP',
    address: '2200 Broad St, Suite 400, Richmond VA 23230',
    timezone: 'Eastern Time (ET)',
    status: 'Operational'
  });

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 1500);
  };

  const pages = [
    { id: 'org', label: 'Organization & Support', icon: Building2, lastUpdate: '2026-04-20', type: 'form' },
    { id: 'terms', label: 'Terms & Conditions', icon: FileText, lastUpdate: '2026-04-10', type: 'text' },
    { id: 'privacy', label: 'Privacy Policy', icon: Shield, lastUpdate: '2026-04-12', type: 'text' },
    { id: 'faq', label: 'Help & FAQ', icon: HelpCircle, lastUpdate: '2026-04-15', type: 'text' },
    { id: 'about', label: 'About Us', icon: Info, lastUpdate: '2026-03-20', type: 'text' },
  ];

  const activePageData = pages.find(p => p.id === activePage);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-ink tracking-tight">Global Configuration</h1>
          <p className="text-ink-3 font-semibold mt-1 tracking-wide">Manage organization details, legal pages, and help content</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" icon={RotateCcw}>Reset Changes</Button>
          <Button
            variant="primary"
            icon={isSaving ? undefined : Save}
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save All Changes'}
          </Button>
        </div>
      </div>

      {showSuccess && (
        <div className="bg-accent text-white px-6 py-3 rounded-2xl shadow-lg flex items-center gap-3 animate-in slide-in-from-top-4 duration-300">
          <CheckCircle size={20} />
          <span className="text-sm font-bold">Settings updated and synchronized across all modules!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar Nav */}
        <aside className="lg:col-span-3 space-y-2">
          {pages.map(page => (
            <button
              key={page.id}
              onClick={() => setActivePage(page.id)}
              className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all group ${activePage === page.id
                  ? 'border-primary bg-primary-tint/20 shadow-md scale-[1.02]'
                  : 'border-transparent bg-white hover:border-line hover:bg-bg'
                }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl transition-colors ${activePage === page.id ? 'bg-primary text-white' : 'bg-bg text-ink-3 group-hover:text-primary'}`}>
                  <page.icon size={18} />
                </div>
                <div className="text-left">
                  <p className={`text-sm font-bold transition-colors ${activePage === page.id ? 'text-primary' : 'text-ink'}`}>{page.label}</p>
                  <p className="text-[9px] font-bold text-ink-4 uppercase tracking-widest mt-0.5">Updated {page.lastUpdate}</p>
                </div>
              </div>
              <ChevronRight size={14} className={activePage === page.id ? 'text-primary' : 'text-line'} />
            </button>
          ))}
        </aside>

        {/* Editor Area */}
        <div className="lg:col-span-9 space-y-6">
          <Card className="p-0 overflow-hidden border-line-2 shadow-sm">
            <div className="p-6 border-b border-line-2 bg-bg/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg border border-line-2 shadow-sm">
                  <Edit3 size={18} className="text-primary" />
                </div>
                <h3 className="text-lg font-bold text-ink">Editor: {activePageData?.label}</h3>
              </div>
              <Badge variant="accent" dot>Global Live Settings</Badge>
            </div>

            <div className="p-8">
              {activePageData?.type === 'text' ? (
                <div className="relative group">
                  <div className="absolute -top-3 left-6 px-2 bg-white text-[10px] font-bold text-primary uppercase tracking-widest z-10">Page Markdown Content</div>
                  <textarea
                    className="w-full h-[500px] p-6 bg-white border-2 border-line rounded-2xl text-ink font-mono text-sm focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none scrollbar-hide resize-none shadow-inner"
                    value={content[activePage] || ''}
                    onChange={(e) => setContent({ ...content, [activePage]: e.target.value })}
                    placeholder="Start typing content here..."
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="space-y-6">
                    <h4 className="text-xs font-black text-ink-4 uppercase tracking-[0.2em]">Contact Channels</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-ink-3 uppercase tracking-widest mb-1.5 ml-1">Support Email</label>
                        <div className="relative group">
                          <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-4 group-focus-within:text-primary transition-colors" />
                          <input
                            type="email"
                            className="w-full h-12 pl-12 pr-4 bg-bg border-2 border-transparent rounded-xl text-sm font-bold text-ink focus:bg-white focus:border-primary/20 transition-all outline-none"
                            value={orgSettings.supportEmail}
                            onChange={(e) => setOrgSettings({ ...orgSettings, supportEmail: e.target.value })}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-ink-3 uppercase tracking-widest mb-1.5 ml-1">Urgent Dispatch Hotline</label>
                        <div className="relative group">
                          <Smartphone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-4 group-focus-within:text-primary transition-colors" />
                          <input
                            type="text"
                            className="w-full h-12 pl-12 pr-4 bg-bg border-2 border-transparent rounded-xl text-sm font-bold text-ink focus:bg-white focus:border-primary/20 transition-all outline-none"
                            value={orgSettings.emergencyPhone}
                            onChange={(e) => setOrgSettings({ ...orgSettings, emergencyPhone: e.target.value })}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-ink-3 uppercase tracking-widest mb-1.5 ml-1">General Office Line</label>
                        <div className="relative group">
                          <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-4 group-focus-within:text-primary transition-colors" />
                          <input
                            type="text"
                            className="w-full h-12 pl-12 pr-4 bg-bg border-2 border-transparent rounded-xl text-sm font-bold text-ink focus:bg-white focus:border-primary/20 transition-all outline-none"
                            value={orgSettings.generalPhone}
                            onChange={(e) => setOrgSettings({ ...orgSettings, generalPhone: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-xs font-black text-ink-4 uppercase tracking-[0.2em]">Administrative Details</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-ink-3 uppercase tracking-widest mb-1.5 ml-1">Organization Name</label>
                        <div className="relative group">
                          <Building2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-4 group-focus-within:text-primary transition-colors" />
                          <input
                            type="text"
                            className="w-full h-12 pl-12 pr-4 bg-bg border-2 border-transparent rounded-xl text-sm font-bold text-ink focus:bg-white focus:border-primary/20 transition-all outline-none"
                            value={orgSettings.name}
                            onChange={(e) => setOrgSettings({ ...orgSettings, name: e.target.value })}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-ink-3 uppercase tracking-widest mb-1.5 ml-1">Headquarters Address</label>
                        <div className="relative group">
                          <MapPin size={16} className="absolute left-4 top-4 text-ink-4 group-focus-within:text-primary transition-colors" />
                          <textarea
                            className="w-full h-28 pl-12 pr-4 py-4 bg-bg border-2 border-transparent rounded-xl text-sm font-bold text-ink focus:bg-white focus:border-primary/20 transition-all outline-none resize-none"
                            value={orgSettings.address}
                            onChange={(e) => setOrgSettings({ ...orgSettings, address: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-8 flex items-center justify-between p-4 bg-bg rounded-2xl border border-line-2">
                <div className="flex items-center gap-3">
                  <Clock size={16} className="text-ink-3" />
                  <p className="text-xs font-bold text-ink-3 italic">Changes made here affect all dispatch terminals globally.</p>
                </div>
                <div className="flex gap-4">
                  <button className="flex items-center gap-1.5 text-xs font-bold text-ink-3 hover:text-primary transition-colors">
                    <ExternalLink size={14} /> View Public View
                  </button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CMS;
