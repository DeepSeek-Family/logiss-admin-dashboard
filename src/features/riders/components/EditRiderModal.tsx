import React, { useState } from 'react';
import { X, User, Phone, Mail, MapPin, HeartPulse, Check, Shield } from 'lucide-react';
import { Button } from '@/shared/components/ui';

interface EditRiderModalProps {
  rider: any;
  onClose: () => void;
  onSave: (updatedData: any) => void;
}

export const EditRiderModal: React.FC<EditRiderModalProps> = ({ rider, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: rider?.name || '',
    email: rider?.email || '',
    phone: rider?.phone || '',
    status: rider?.status || 'active',
    mobility: rider?.mobility || 'Ambulatory',
    source: rider?.source || '',
    program: rider?.program || '',
    authorizationId: rider?.authorizationId || rider?.authId || '',
    defaultPickup: rider?.defaultPickup || '',
    defaultDropoff: rider?.defaultDropoff || '',
    emergencyName: rider?.emergencyContact?.name || '',
    emergencyRelation: rider?.emergencyContact?.relation || '',
    emergencyPhone: rider?.emergencyContact?.phone || '',
  });

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: form.name,
      email: form.email,
      phone: form.phone,
      status: form.status,
      mobility: form.mobility,
      source: form.source,
      program: form.program,
      authorizationId: form.authorizationId,
      defaultPickup: form.defaultPickup,
      defaultDropoff: form.defaultDropoff,
      emergencyContact: {
        name: form.emergencyName,
        relation: form.emergencyRelation,
        phone: form.emergencyPhone,
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div 
        className="bg-white rounded-2xl border border-line-2 shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200 my-8"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line-2 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <User size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-ink">Edit Rider Profile</h3>
              <p className="text-xs text-ink-4">Update information for {rider?.name || 'rider'}</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-4 hover:bg-bg hover:text-ink transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* General Information */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
              <User size={13} className="text-primary" /> Personal Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink-3 mb-1.5">Full Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => handleChange('name', e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-bg/50 border border-line-2 rounded-xl text-ink outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-3 mb-1.5">Phone Number *</label>
                <input
                  type="text"
                  required
                  value={form.phone}
                  onChange={e => handleChange('phone', e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-bg/50 border border-line-2 rounded-xl text-ink outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-ink-3 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => handleChange('email', e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-bg/50 border border-line-2 rounded-xl text-ink outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-3 mb-1.5">Status</label>
                <select
                  value={form.status}
                  onChange={e => handleChange('status', e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-bg/50 border border-line-2 rounded-xl text-ink outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-3 mb-1.5">Mobility Requirement</label>
                <select
                  value={form.mobility}
                  onChange={e => handleChange('mobility', e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-bg/50 border border-line-2 rounded-xl text-ink outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                >
                  <option value="Ambulatory">Ambulatory</option>
                  <option value="Wheelchair">Wheelchair</option>
                  <option value="Cane">Cane / Walker</option>
                  <option value="Stretcher">Stretcher</option>
                </select>
              </div>
            </div>
          </div>

          {/* Program & Authorization */}
          <div className="space-y-4 pt-4 border-t border-line-2">
            <h4 className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
              <Shield size={13} className="text-primary" /> Program & Authorization
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink-3 mb-1.5">Payer</label>
                <input
                  type="text"
                  placeholder="e.g. Powhatan DSS"
                  value={form.source}
                  onChange={e => handleChange('source', e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-bg/50 border border-line-2 rounded-xl text-ink outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-3 mb-1.5">Authorization ID</label>
                <input
                  type="text"
                  placeholder="e.g. AUTH-CHEST-9912"
                  value={form.authorizationId}
                  onChange={e => handleChange('authorizationId', e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-bg/50 border border-line-2 rounded-xl text-ink outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>
          </div>

          {/* Default Locations */}
          <div className="space-y-4 pt-4 border-t border-line-2">
            <h4 className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
              <MapPin size={13} className="text-primary" /> Default Locations
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-ink-3 mb-1.5">Home / Pickup Address</label>
                <input
                  type="text"
                  placeholder="Address, City, State"
                  value={form.defaultPickup}
                  onChange={e => handleChange('defaultPickup', e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-bg/50 border border-line-2 rounded-xl text-ink outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-3 mb-1.5">Primary Facility / Dropoff</label>
                <input
                  type="text"
                  placeholder="Hospital or Clinic Name"
                  value={form.defaultDropoff}
                  onChange={e => handleChange('defaultDropoff', e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-bg/50 border border-line-2 rounded-xl text-ink outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="space-y-4 pt-4 border-t border-line-2">
            <h4 className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
              <HeartPulse size={13} className="text-urgent" /> Emergency Contact
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-ink-3 mb-1.5">Contact Name</label>
                <input
                  type="text"
                  placeholder="Name"
                  value={form.emergencyName}
                  onChange={e => handleChange('emergencyName', e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-bg/50 border border-line-2 rounded-xl text-ink outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-3 mb-1.5">Relationship</label>
                <input
                  type="text"
                  placeholder="e.g. Daughter, Spouse"
                  value={form.emergencyRelation}
                  onChange={e => handleChange('emergencyRelation', e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-bg/50 border border-line-2 rounded-xl text-ink outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-3 mb-1.5">Contact Phone</label>
                <input
                  type="text"
                  placeholder="(804) 555-0000"
                  value={form.emergencyPhone}
                  onChange={e => handleChange('emergencyPhone', e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-bg/50 border border-line-2 rounded-xl text-ink outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-line-2 flex items-center justify-end gap-3 sticky bottom-0 bg-white">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-10 text-sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon={Check}
              className="h-10 text-sm px-5"
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
