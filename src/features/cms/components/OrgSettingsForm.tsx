import { Mail, Smartphone, Phone, Building2, MapPin } from 'lucide-react';

interface OrgSettings {
  name: string;
  supportEmail: string;
  emergencyPhone: string;
  generalPhone: string;
  address: string;
  timezone: string;
  status: string;
}

interface OrgSettingsFormProps {
  orgSettings: OrgSettings;
  setOrgSettings: (val: OrgSettings) => void;
}

export const OrgSettingsForm = ({ orgSettings, setOrgSettings }: OrgSettingsFormProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-6">
        <h4 className="text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em]">Contact Channels</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em] mb-1.5 ml-1">Support Email</label>
            <div className="relative group">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-4 group-focus-within:text-primary transition-colors" />
              <input
                type="email"
                className="w-full h-12 pl-12 pr-4 bg-bg border-2 border-transparent rounded-xl text-sm font-medium text-ink focus:bg-white focus:border-primary/20 transition-all outline-none"
                value={orgSettings.supportEmail}
                onChange={(e) => setOrgSettings({ ...orgSettings, supportEmail: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em] mb-1.5 ml-1">Urgent Dispatch Hotline</label>
            <div className="relative group">
              <Smartphone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-4 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                className="w-full h-12 pl-12 pr-4 bg-bg border-2 border-transparent rounded-xl text-sm font-medium text-ink focus:bg-white focus:border-primary/20 transition-all outline-none"
                value={orgSettings.emergencyPhone}
                onChange={(e) => setOrgSettings({ ...orgSettings, emergencyPhone: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em] mb-1.5 ml-1">General Office Line</label>
            <div className="relative group">
              <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-4 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                className="w-full h-12 pl-12 pr-4 bg-bg border-2 border-transparent rounded-xl text-sm font-medium text-ink focus:bg-white focus:border-primary/20 transition-all outline-none"
                value={orgSettings.generalPhone}
                onChange={(e) => setOrgSettings({ ...orgSettings, generalPhone: e.target.value })}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h4 className="text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em]">Administrative Details</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em] mb-1.5 ml-1">Organization Name</label>
            <div className="relative group">
              <Building2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-4 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                className="w-full h-12 pl-12 pr-4 bg-bg border-2 border-transparent rounded-xl text-sm font-medium text-ink focus:bg-white focus:border-primary/20 transition-all outline-none"
                value={orgSettings.name}
                onChange={(e) => setOrgSettings({ ...orgSettings, name: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em] mb-1.5 ml-1">Headquarters Address</label>
            <div className="relative group">
              <MapPin size={16} className="absolute left-4 top-4 text-ink-4 group-focus-within:text-primary transition-colors" />
              <textarea
                className="w-full h-28 pl-12 pr-4 py-4 bg-bg border-2 border-transparent rounded-xl text-sm font-medium text-ink focus:bg-white focus:border-primary/20 transition-all outline-none resize-none"
                value={orgSettings.address}
                onChange={(e) => setOrgSettings({ ...orgSettings, address: e.target.value })}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
