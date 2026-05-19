import { useState, useRef } from 'react';
import {
  User, Mail, Phone, MapPin,
  Camera, Loader2, CheckCircle2,
} from 'lucide-react';
import { Card, Badge, Button } from '@/shared/components/ui';

const PROFILES = {
  admin: {
    name: 'Marcus A. Holloway',
    email: 'm.holloway@logiss.com',
    phone: '(804) 555-0882',
    region: 'Richmond, VA',
    role: 'Administrator',
    employeeId: 'LOGISS-882',
    department: 'Operations & Fleet',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
  },
  dispatcher: {
    name: 'Sandra K. Reynolds',
    email: 's.reynolds@logiss.com',
    phone: '(804) 555-0941',
    region: 'Richmond, VA',
    role: 'Dispatch Officer',
    employeeId: 'LOGISS-941',
    department: 'Dispatch Center',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
  },
};

const Field = ({ label, icon: Icon, value, readOnly }: { label: string; icon?: any; value: string; readOnly?: boolean }) => (
  <div>
    <p className="text-xs font-semibold text-ink-4 mb-1.5">{label}</p>
    <div className="relative">
      {Icon && <Icon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-4 pointer-events-none" />}
      <input
        defaultValue={value}
        readOnly={readOnly}
        className={`w-full h-11 rounded-xl border border-line-2 text-sm font-medium text-ink bg-bg ${Icon ? 'pl-10' : 'pl-4'} pr-4 focus:outline-none focus:border-primary/30 focus:bg-white transition-all ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
      />
    </div>
  </div>
);

const Profile = ({ role }: { role?: string | null }) => {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [previewImg, setPreviewImg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const p = PROFILES[role as keyof typeof PROFILES] || PROFILES.dispatcher;
  const displayImg = previewImg || p.image;

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => { setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000); }, 900);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPreviewImg(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-2xl mx-auto pb-16 animate-in fade-in duration-300">

      {/* Header */}
      <div className="flex items-center gap-5 mb-8 pb-8 border-b border-line-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-semibold text-ink">{p.name}</h1>
            <Badge variant="primary-light" className="text-xs">{p.role}</Badge>
          </div>
          <p className="text-sm text-ink-4 mt-0.5">{p.employeeId} · {p.department}</p>
        </div>
        <Button variant="primary" onClick={handleSave} disabled={saving} className="shrink-0">
          {saving
            ? <><Loader2 size={14} className="animate-spin inline mr-1.5" />Saving</>
            : saved
              ? <><CheckCircle2 size={14} className="inline mr-1.5" />Saved</>
              : 'Save Changes'}
        </Button>
      </div>

      <Card className="p-6 space-y-6">

        {/* Photo Upload */}
        <div>
          <p className="text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em] mb-4">Profile Photo</p>
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-line shadow-md bg-bg">
                <img src={displayImg} alt={p.name} className="w-full h-full object-cover" />
              </div>
              {previewImg && (
                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-accent rounded-full flex items-center justify-center shadow">
                  <CheckCircle2 size={11} className="text-white" />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
              <Button variant="outline" size="sm" icon={Camera} onClick={() => fileRef.current?.click()}>
                {previewImg ? 'Change Photo' : 'Upload Photo'}
              </Button>
              {previewImg && (
                <button
                  onClick={() => setPreviewImg(null)}
                  className="block text-xs font-semibold text-ink-4 hover:text-urgent transition-colors"
                >
                  Remove
                </button>
              )}
              <p className="text-xs text-ink-4">JPG, PNG or WebP · Max 2MB</p>
            </div>
          </div>
        </div>

        {/* Personal Info */}
        <div className="pt-5 border-t border-line-2">
          <p className="text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em] mb-5">Personal Information</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full Name" icon={User} value={p.name} />
            <Field label="Email Address" icon={Mail} value={p.email} />
            <Field label="Phone Number" icon={Phone} value={p.phone} />
            <Field label="Reporting Region" icon={MapPin} value={p.region} />
          </div>
        </div>


      </Card>
    </div>
  );
};

export default Profile;
