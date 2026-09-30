import React from 'react';
import { Mail, Smartphone, Phone, Building2, MapPin, Headphones, Globe, Clock, ShieldCheck } from 'lucide-react';

import type { OrgSettings } from '@/features/cms/utils/supportHelpers';

interface OrgSettingsFormProps {
  orgSettings: OrgSettings;
  setOrgSettings: (val: OrgSettings) => void;
  disabled?: boolean;
}

const inputClass =
  'w-full h-11 pl-11 pr-4 bg-white border border-line-2 rounded-lg text-sm font-medium text-ink focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none placeholder:text-ink-4 shadow-2xs';

const Field = ({
  label,
  icon: Icon,
  helper,
  children,
}: {
  label: string;
  icon: React.ElementType;
  helper?: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between">
      <label className="text-sm">
        {label}
      </label>
      {helper && <span className="text-xs text-ink-4">{helper}</span>}
    </div>
    <div className="relative group">
      <Icon
        size={16}
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-4 group-focus-within:text-primary transition-colors"
      />
      {children}
    </div>
  </div>
);

export const OrgSettingsForm: React.FC<OrgSettingsFormProps> = ({ orgSettings, setOrgSettings, disabled = false }) => {
  const set = (key: keyof OrgSettings) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setOrgSettings({ ...orgSettings, [key]: e.target.value });

  return (
    <fieldset disabled={disabled} className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-300 disabled:opacity-60">
      {/* Left Column — Contact Channels */}
      <div className="space-y-5">
        <div className="flex items-center gap-2 pb-2.5 border-b border-line-2">
          <div className="w-1.5 h-4 bg-primary rounded-full" />
          <h4 className="text-sm font-bold text-ink">Contact Channels & Helplines</h4>
        </div>

        <div className="space-y-4">
          <Field label="Support Email" icon={Mail} helper="Primary communications">
            <input
              type="email"
              className={inputClass}
              value={orgSettings.supportEmail}
              onChange={set('supportEmail')}
              placeholder="support@logiss.com"
            />
          </Field>

          <Field label="Helpline Number (Rider Facing)" icon={Headphones} helper="In-app caller ID">
            <input
              type="tel"
              className={inputClass}
              placeholder="(804) 555-HELP"
              value={orgSettings.helplinePhone}
              onChange={set('helplinePhone')}
            />
          </Field>

          <Field label="Dispatcher Direct Line" icon={Smartphone} helper="Internal dispatch terminal">
            <input
              type="tel"
              className={inputClass}
              placeholder="(804) 555-DISP"
              value={orgSettings.dispatcherPhone}
              onChange={set('dispatcherPhone')}
            />
          </Field>

          <Field label="Emergency / Urgent Hotline" icon={Phone} helper="24/7 Priority desk">
            <input
              type="tel"
              className={inputClass}
              placeholder="(804) 555-LOGI"
              value={orgSettings.emergencyPhone}
              onChange={set('emergencyPhone')}
            />
          </Field>

          <Field label="General Office Line" icon={Phone}>
            <input
              type="tel"
              className={inputClass}
              placeholder="(804) 555-MAIN"
              value={orgSettings.generalPhone}
              onChange={set('generalPhone')}
            />
          </Field>
        </div>
      </div>

      {/* Right Column — Organization & Facility Details */}
      <div className="space-y-5">
        <div className="flex items-center gap-2 pb-2.5 border-b border-line-2">
          <div className="w-1.5 h-4 bg-accent rounded-full" />
          <h4 className="text-sm font-bold text-ink">Administrative & Facility Details</h4>
        </div>

        <div className="space-y-4">
          <Field label="Organization Legal Name" icon={Building2}>
            <input
              type="text"
              className={inputClass}
              value={orgSettings.name}
              onChange={set('name')}
              placeholder="Loggiskabir Dispatch Center"
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="System Timezone" icon={Clock}>
              <input
                type="text"
                className={inputClass}
                value={orgSettings.timezone || 'Eastern Time (ET)'}
                onChange={set('timezone')}
                placeholder="Eastern Time (ET)"
              />
            </Field>

            <Field label="Operational Status" icon={ShieldCheck}>
              <input
                type="text"
                className={inputClass}
                value={orgSettings.status || 'Operational'}
                onChange={set('status')}
                placeholder="Operational"
              />
            </Field>
          </div>

          <div className="space-y-1">
            <label className="block text-sm text-ink">
              Headquarters Address & Hub Location
            </label>
            <div className="relative group">
              <MapPin
                size={16}
                className="absolute left-3.5 top-3.5 text-ink-4 group-focus-within:text-primary transition-colors"
              />
              <textarea
                rows={3}
                className="w-full pl-11 pr-4 py-3 bg-white border border-line-2 rounded-lg text-sm font-medium text-ink focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none resize-none placeholder:text-ink-4 shadow-2xs"
                value={orgSettings.address}
                onChange={set('address')}
                placeholder="2200 Broad St, Suite 400, Richmond VA 23230"
              />
            </div>
          </div>
        </div>
      </div>
    </fieldset>
  );
};
