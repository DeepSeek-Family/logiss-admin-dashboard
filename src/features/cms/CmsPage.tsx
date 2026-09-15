import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  Building2,
} from 'lucide-react';
import { Card, Button, Badge } from '@/shared/components/ui';

import {
  OrgSettingsForm,
  ContentEditor,
  FaqPanel
} from '@/features/cms';

interface ContentState {
  [key: string]: string;
}

interface OrgSettings {
  name: string;
  supportEmail: string;
  helplinePhone: string;
  dispatcherPhone: string;
  emergencyPhone: string;
  generalPhone: string;
  address: string;
  timezone: string;
  status: string;
}

const CMS = ({ role }: { role?: string | null }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const pages = [
    { id: 'org', label: 'Organization & Support', icon: Building2, lastUpdate: '2026-04-20', type: 'form' },
    { id: 'terms', label: 'Terms & Conditions', icon: FileText, lastUpdate: '2026-04-10', type: 'text' },
    { id: 'privacy', label: 'Privacy Policy', icon: Shield, lastUpdate: '2026-04-12', type: 'text' },
    { id: 'faq', label: 'Help & FAQ', icon: HelpCircle, lastUpdate: '2026-04-15', type: 'faq' },
    { id: 'about', label: 'About Us', icon: Info, lastUpdate: '2026-03-20', type: 'text' },
  ];

  const validTabIds = pages.map(p => p.id);
  const tabFromUrl = searchParams.get('tab');
  const activePage = validTabIds.includes(tabFromUrl || '') ? (tabFromUrl as string) : 'org';

  const handleTabChange = (tabId: string) => {
    setSearchParams({ tab: tabId }, { replace: true });
  };

  const [content, setContent] = useState<ContentState>({
    terms: `1. Acceptance of Terms\nBy using LOGISS, you agree to these terms...\n\n2. Dispatcher Responsibility\nDispatchers must verify all medical requirements before assignment...`,
    privacy: `Your privacy is important to us. This policy explains how we collect and use your data to provide medical transportation services...`,
    faq: `Q: How to reset dispatcher password?\nA: Go to Security settings...\n\nQ: What is a Will-Call trip?\nA: A trip where the return time is not fixed...`,
    about: `LOGISS is a premier medical transportation management platform...`
  });

  const [orgSettings, setOrgSettings] = useState<OrgSettings>({
    name: 'Loggiskabir Dispatch Center',
    supportEmail: 'support@logiss.com',
    helplinePhone: '(804) 555-HELP',
    dispatcherPhone: '(804) 555-DISP',
    emergencyPhone: '(804) 555-LOGI',
    generalPhone: '(804) 555-MAIN',
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

  const activePageData = pages.find(p => p.id === activePage);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="type-page-title">Global Configuration</h1>
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
          <span className="text-sm font-medium">Settings updated and synchronized across all modules!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar Nav */}
        <aside className="lg:col-span-3 space-y-2">
          {pages.map(page => {
            const isActive = activePage === page.id;
            return (
              <button
                key={page.id}
                type="button"
                onClick={() => handleTabChange(page.id)}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left group ${
                  isActive
                    ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20'
                    : 'border-line-2 bg-white hover:border-primary/20 hover:bg-bg/50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    isActive ? 'bg-primary text-white shadow-xs' : 'bg-bg text-ink-3 group-hover:text-primary group-hover:bg-primary/10'
                  }`}>
                    <page.icon size={17} />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold truncate transition-colors ${
                      isActive ? 'text-primary' : 'text-ink group-hover:text-primary'
                    }`}>
                      {page.label}
                    </p>
                    <p className="text-xs font-normal text-ink-4 mt-0.5">
                      Updated {page.lastUpdate}
                    </p>
                  </div>
                </div>
                <ChevronRight size={15} className={`shrink-0 transition-colors ${isActive ? 'text-primary' : 'text-ink-4 group-hover:text-ink-3'}`} />
              </button>
            );
          })}
        </aside>

        {/* Editor Area */}
        <div className="lg:col-span-9 space-y-6">
          <Card className="p-0 overflow-hidden border-line-2 shadow-sm">
            <div className="p-6 border-b border-line-2 bg-bg/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg border border-line-2 shadow-sm">
                  <Edit3 size={18} className="text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-ink">Editor: {activePageData?.label}</h3>
              </div>
              <Badge variant="accent" dot>Global Live Settings</Badge>
            </div>

            <div className="p-8">
              {activePageData?.type === 'text' ? (
                <ContentEditor
                  activePage={activePage}
                  content={content}
                  setContent={setContent}
                />
              ) : activePageData?.type === 'faq' ? (
                <FaqPanel />
              ) : (
                <OrgSettingsForm
                  orgSettings={orgSettings}
                  setOrgSettings={setOrgSettings}
                />
              )}

              <div className="mt-8 flex items-center justify-between p-4 bg-bg rounded-2xl border border-line-2">
                <div className="flex items-center gap-3">
                  <Clock size={16} className="text-ink-3" />
                  <p className="text-xs text-ink-4 italic">Changes made here affect all dispatch terminals globally.</p>
                </div>
                <div className="flex gap-4">
                  <button className="flex items-center gap-1.5 text-xs font-medium text-ink-4 hover:text-primary transition-colors">
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
