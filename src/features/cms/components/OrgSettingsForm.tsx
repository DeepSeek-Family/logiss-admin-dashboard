import { Mail, Smartphone, Phone, Building2, MapPin, Headphones } from 'lucide-react';

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

interface OrgSettingsFormProps {
  orgSettings: OrgSettings;
  setOrgSettings: (val: OrgSettings) => void;
}

const inputClass =
  'w-full h-12 pl-12 pr-4 bg-bg border-2 border-transparent rounded-xl text-sm font-medium text-ink focus:bg-white focus:border-primary/20 transition-all outline-none';

const Field = ({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) => (
  <div>
    <label className="block type-th mb-1.5 ml-1">
      {label}
    </label>
    <div className="relative group">
      <Icon
        size={16}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-4 group-focus-within:text-primary transition-colors"
      />
      {children}
    </div>
  </div>
);

export const OrgSettingsForm = ({ orgSettings, setOrgSettings }: OrgSettingsFormProps) => {
  const set = (key: keyof OrgSettings) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setOrgSettings({ ...orgSettings, [key]: e.target.value });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Left — Contact Channels */}
      <div className="space-y-6">
        <h4 className="type-th">Contact Channels</h4>
        <div className="space-y-4">
          <Field label="Support Email" icon={Mail}>
            <input type="email" className={inputClass} value={orgSettings.supportEmail} onChange={set('supportEmail')} />
          </Field>

          <Field label="Helpline Number (Rider Facing)" icon={Headphones}>
            <input
              type="tel"
              className={inputClass}
              placeholder="e.g. (804) 555-HELP"
              value={orgSettings.helplinePhone}
              onChange={set('helplinePhone')}
            />
          </Field>

          <Field label="Dispatcher Direct Line" icon={Smartphone}>
            <input
              type="tel"
              className={inputClass}
              placeholder="e.g. (804) 555-DISP"
              value={orgSettings.dispatcherPhone}
              onChange={set('dispatcherPhone')}
            />
          </Field>

          <Field label="Emergency / Urgent Hotline" icon={Phone}>
            <input
              type="tel"
              className={inputClass}
              placeholder="e.g. (804) 555-URGT"
              value={orgSettings.emergencyPhone}
              onChange={set('emergencyPhone')}
            />
          </Field>

          <Field label="General Office Line" icon={Phone}>
            <input
              type="tel"
              className={inputClass}
              value={orgSettings.generalPhone}
              onChange={set('generalPhone')}
            />
          </Field>
        </div>
      </div>

      {/* Right — Admin Details */}
      <div className="space-y-6">
        <h4 className="type-th">Administrative Details</h4>
        <div className="space-y-4">
          <Field label="Organization Name" icon={Building2}>
            <input type="text" className={inputClass} value={orgSettings.name} onChange={set('name')} />
          </Field>

          <div>
            <label className="block type-th mb-1.5 ml-1">
              Headquarters Address
            </label>
            <div className="relative group">
              <MapPin
                size={16}
                className="absolute left-4 top-4 text-ink-4 group-focus-within:text-primary transition-colors"
              />
              <textarea
                className="w-full h-28 pl-12 pr-4 py-4 bg-bg border-2 border-transparent rounded-xl text-sm font-medium text-ink focus:bg-white focus:border-primary/20 transition-all outline-none resize-none"
                value={orgSettings.address}
                onChange={set('address')}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
