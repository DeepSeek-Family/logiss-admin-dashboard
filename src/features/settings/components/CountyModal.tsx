import { useState, useEffect } from 'react';
import { X, MapPin, CheckCircle2, AlertCircle, Plus } from 'lucide-react';
import { Button } from '@/shared/components/ui';
import { CountyConfig } from '@/hooks/usePricing';
import { resolveFenceLists, parsePolygon, seedFencePolygon } from '@/utils/geofenceEngine';
import { GeofenceDrawMap } from './GeofenceDrawMap';

interface CountyModalProps {
  isOpen: boolean;
  county: CountyConfig | null;
  onClose: () => void;
  onSave: (data: Omit<CountyConfig, 'id'>) => void;
}

function parseZip(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 5) return digits;
  if (digits.length === 9) return digits.slice(0, 5);
  return null;
}

export const CountyModal = ({ isOpen, county, onClose, onSave }: CountyModalProps) => {
  const [form, setForm] = useState({
    name: '',
    state: 'VA',
    localFare: 10,
    status: 'active' as 'active' | 'inactive',
    zipCodes: [] as string[],
    cities: [] as string[],
    polygon: [] as [number, number][],
  });
  const [zipDraft, setZipDraft] = useState('');
  const [cityDraft, setCityDraft] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (county) {
      const lists = resolveFenceLists(county);
      setForm({
        name: county.name || '',
        state: county.state || 'VA',
        localFare: county.localFare != null ? county.localFare : 10,
        status: county.status || 'active',
        zipCodes: [...lists.zipCodes],
        cities: [...lists.cities],
        polygon: Array.isArray(county.polygon)
          ? parsePolygon(county.polygon)
          : seedFencePolygon(county.id, county.name),
      });
    } else {
      setForm({
        name: '',
        state: 'VA',
        localFare: 10,
        status: 'active',
        zipCodes: [],
        cities: [],
        polygon: [],
      });
    }
    setZipDraft('');
    setCityDraft('');
    setErrors({});
  }, [county, isOpen]);

  if (!isOpen) return null;

  const addZip = () => {
    const zip = parseZip(zipDraft);
    if (!zip) {
      setErrors(prev => ({ ...prev, zip: 'Enter a 5-digit ZIP' }));
      return;
    }
    if (form.zipCodes.includes(zip)) {
      setZipDraft('');
      setErrors(prev => ({ ...prev, zip: '' }));
      return;
    }
    setForm({ ...form, zipCodes: [...form.zipCodes, zip] });
    setZipDraft('');
    setErrors(prev => ({ ...prev, zip: '' }));
  };

  const addCity = () => {
    const city = cityDraft.trim();
    if (!city) {
      setErrors(prev => ({ ...prev, city: 'Enter a city or town' }));
      return;
    }
    if (form.cities.some(c => c.toLowerCase() === city.toLowerCase())) {
      setCityDraft('');
      setErrors(prev => ({ ...prev, city: '' }));
      return;
    }
    setForm({ ...form, cities: [...form.cities, city] });
    setCityDraft('');
    setErrors(prev => ({ ...prev, city: '' }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!form.name.trim()) {
      newErrors.name = 'Area name is required';
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const zipCodes = form.zipCodes.map(z => parseZip(z) || z.trim()).filter(Boolean);
    const uniqueZips = [...new Set(zipCodes)];
    const seenCities = new Set<string>();
    const cities: string[] = [];
    for (const raw of form.cities) {
      const city = raw.trim();
      if (!city) continue;
      const key = city.toLowerCase();
      if (seenCities.has(key)) continue;
      seenCities.add(key);
      cities.push(city);
    }

    onSave({
      name: form.name.trim(),
      state: form.state.trim().toUpperCase(),
      localFare: Number(form.localFare) || 0,
      status: form.status,
      notes: county?.notes || '',
      zipCodes: uniqueZips,
      cities,
      polygon: parsePolygon(form.polygon),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-line-2">
        <div className="flex items-center justify-between px-6 py-4 border-b border-line-2 bg-bg/50 sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <MapPin size={18} />
            </div>
            <h2 className="type-section-title">{county ? 'Edit service area' : 'Add service area'}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-ink-4 hover:text-ink hover:bg-bg rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="type-label block text-ink-3 mb-1.5">Area name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => {
                  setForm({ ...form, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: '' });
                }}
                placeholder="Chesterfield County"
                className={`input-base h-10 w-full ${errors.name ? 'border-urgent focus:ring-urgent/20' : ''}`}
              />
              {errors.name && (
                <p className="text-xs text-urgent mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.name}
                </p>
              )}
            </div>
            <div>
              <label className="type-label block text-ink-3 mb-1.5">State</label>
              <input
                type="text"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                placeholder="VA"
                maxLength={3}
                className="input-base h-10 w-full uppercase"
              />
            </div>
          </div>

          <GeofenceDrawMap
            key={county?.id || 'new'}
            polygon={form.polygon}
            onChange={poly => setForm(f => ({ ...f, polygon: poly }))}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="type-label block text-ink-3 mb-1.5">ZIP codes</label>
              {form.zipCodes.length > 0 && (
                <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto mb-2">
                  {form.zipCodes.map(zip => (
                    <span
                      key={zip}
                      className="inline-flex items-center gap-0.5 h-7 pl-2 pr-0.5 rounded-lg bg-bg border border-line-2 text-xs font-medium text-ink"
                    >
                      {zip}
                      <button
                        type="button"
                        aria-label={`Remove ZIP ${zip}`}
                        onClick={() =>
                          setForm({ ...form, zipCodes: form.zipCodes.filter(z => z !== zip) })
                        }
                        className="p-0.5 text-ink-4 hover:text-urgent rounded"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-1.5">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={5}
                  value={zipDraft}
                  onChange={(e) => {
                    setZipDraft(e.target.value.replace(/\D/g, '').slice(0, 5));
                    if (errors.zip) setErrors({ ...errors, zip: '' });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addZip();
                    }
                  }}
                  placeholder="5-digit ZIP"
                  className={`input-base h-10 w-full ${errors.zip ? 'border-urgent focus:ring-urgent/20' : ''}`}
                />
                <Button type="button" variant="outline" onClick={addZip} className="h-10 shrink-0 rounded-xl px-3 text-sm">
                  <Plus size={16} /> Add
                </Button>
              </div>
              {errors.zip && (
                <p className="text-xs text-urgent mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.zip}
                </p>
              )}
            </div>

            <div>
              <label className="type-label block text-ink-3 mb-1.5">Cities</label>
              {form.cities.length > 0 && (
                <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto mb-2">
                  {form.cities.map(city => (
                    <span
                      key={city}
                      className="inline-flex items-center gap-0.5 h-7 pl-2 pr-0.5 rounded-lg bg-bg border border-line-2 text-xs font-medium text-ink"
                    >
                      {city}
                      <button
                        type="button"
                        aria-label={`Remove ${city}`}
                        onClick={() =>
                          setForm({
                            ...form,
                            cities: form.cities.filter(c => c.toLowerCase() !== city.toLowerCase()),
                          })
                        }
                        className="p-0.5 text-ink-4 hover:text-urgent rounded"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={cityDraft}
                  onChange={(e) => {
                    setCityDraft(e.target.value);
                    if (errors.city) setErrors({ ...errors, city: '' });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCity();
                    }
                  }}
                  placeholder="City or town"
                  className={`input-base h-10 w-full ${errors.city ? 'border-urgent focus:ring-urgent/20' : ''}`}
                />
                <Button type="button" variant="outline" onClick={addCity} className="h-10 shrink-0 rounded-xl px-3 text-sm">
                  <Plus size={16} /> Add
                </Button>
              </div>
              {errors.city && (
                <p className="text-xs text-urgent mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.city}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-ink">Active</p>
            <button
              type="button"
              role="switch"
              aria-checked={form.status === 'active'}
              onClick={() => setForm({ ...form, status: form.status === 'active' ? 'inactive' : 'active' })}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                form.status === 'active' ? 'bg-primary' : 'bg-line-2'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  form.status === 'active' ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-line-2">
            <Button
              variant="outline"
              size="md"
              type="button"
              onClick={onClose}
              className="h-10 min-w-[7rem] rounded-xl px-4 text-sm"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              type="submit"
              className="h-10 min-w-[7.5rem] rounded-xl px-4 text-sm"
            >
              <CheckCircle2 size={16} />
              {county ? 'Save' : 'Add area'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
