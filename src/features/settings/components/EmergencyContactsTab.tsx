import { AlertTriangle, Phone, Bell, MapPin } from 'lucide-react';
import { Card } from '@/shared/components/ui';

export const EmergencyContactsTab = () => {
  return (
    <div className="animate-in slide-in-from-bottom-2 duration-200">
      <Card className="p-8 space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-ink">Organization Contact Channels</h3>
          <p className="text-xs text-ink-4 mt-1 font-medium">Platform-wide support and emergency communication parameters.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 mt-6">
          <div className="flex items-center gap-5 p-6 bg-urgent-light/40 rounded-3xl border border-urgent/10 group hover:border-urgent/30 transition-all">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-urgent shadow-lg shadow-urgent/10 group-hover:scale-105 transition-transform">
              <AlertTriangle size={24} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-urgent mb-1">Emergency Operational Hotline</p>
              <p className="text-xl font-semibold font-mono text-ink">(804) 555-9110</p>
              <p className="text-xs font-medium text-urgent/60 mt-1">Direct Priority Access · 24/7 Monitoring</p>
            </div>
          </div>

          <div className="flex items-center gap-5 p-6 bg-primary-tint/20 rounded-3xl border border-primary/10 group hover:border-primary/30 transition-all">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-primary shadow-lg shadow-primary/10 group-hover:scale-105 transition-transform">
              <Phone size={24} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-primary mb-1">General Dispatch Control</p>
              <p className="text-xl font-semibold font-mono text-ink">(804) 555-LOGI</p>
              <p className="text-xs text-ink-4 mt-1">Standard Operations · 6 AM – 10 PM EST</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-4 p-5 bg-bg rounded-2xl border border-line-2 group hover:bg-white transition-all">
              <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center text-ink-3 border border-line-2 group-hover:text-primary group-hover:border-primary/20 transition-all">
                <Bell size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-ink-4">Support Email</p>
                <p className="text-sm font-medium text-ink truncate">support@loggiskabir.com</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-5 bg-bg rounded-2xl border border-line-2 group hover:bg-white transition-all">
              <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center text-ink-3 border border-line-2 group-hover:text-primary group-hover:border-primary/20 transition-all">
                <MapPin size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-ink-4">HQ Address</p>
                <p className="text-sm font-medium text-ink truncate">Richmond, VA 23230</p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-line-2">
          <p className="text-xs text-ink-4 text-center italic">
            These contact parameters are managed globally by Platform Administrators via the CMS.
          </p>
        </div>
      </Card>
    </div>
  );
};
