import React, { useEffect, useState } from 'react';
import { Clock, Power, Wrench, CheckCircle2, Loader2, Phone, Package, Star, User, X, Navigation } from 'lucide-react';
import { Card, Badge, Avatar, Button } from '@/shared/components/ui';

interface FleetAssignmentPanelProps {
  vehicle: any;
  driver: any;
  handleStatusChange: (status: string) => void;
  updatingStatus: boolean;
  setAssigning: (val: boolean) => void;
  assigning: boolean;
  assignmentOptions: any[];
  driversLoading?: boolean;
  getAssignedVehicle: (id: string) => any;
  isDriverUnavailable: (driver: any) => boolean;
  assigningDriverId: string | null;
  onConfirmAssign: (driverId: string) => void | Promise<void>;
}

export const FleetAssignmentPanel: React.FC<FleetAssignmentPanelProps> = ({
  vehicle,
  driver,
  handleStatusChange,
  updatingStatus,
  setAssigning,
  assigning,
  assignmentOptions,
  driversLoading = false,
  getAssignedVehicle,
  isDriverUnavailable,
  assigningDriverId,
  onConfirmAssign,
}) => {
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);

  useEffect(() => {
    if (!assigning) {
      setSelectedDriverId(null);
      return;
    }
    setSelectedDriverId(vehicle.assignedDriverId || null);
  }, [assigning, vehicle.assignedDriverId]);

  const handleConfirm = async () => {
    if (!selectedDriverId || selectedDriverId === vehicle.assignedDriverId) return;
    await onConfirmAssign(selectedDriverId);
  };

  return (
    <>
      <Card className="p-6 border-line-2 shadow-sm">
        <h4 className="type-th mb-6">Operational Control</h4>

        <div className="flex items-center gap-4 mb-6">
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all shadow-sm ${vehicle.status === 'available' ? 'bg-accent-light text-accent' :
              vehicle.status === 'maintenance' ? 'bg-urgent-light text-urgent' : 'bg-ink/5 text-ink'
            }`}>
            {vehicle.status === 'available' ? <Power size={24} /> : vehicle.status === 'maintenance' ? <Wrench size={24} /> : <Clock size={24} />}
          </div>
          <div>
            <p className="type-label text-ink-4">Vehicle State</p>
            <p className="text-lg font-semibold text-ink capitalize mt-0.5">{vehicle.status.replace('_', ' ')}</p>
          </div>
        </div>

        <div className="space-y-2">
          {[
            { id: 'available', label: 'Set to Active / Available', icon: Power, color: 'accent' },
            { id: 'maintenance', label: 'Flag for Maintenance', icon: Wrench, color: 'urgent' },
            { id: 'off_duty', label: 'Recall to Base / Off-Duty', icon: Clock, color: 'ink-4' }
          ].map(s => (
            <button
              key={s.id}
              type="button"
              onClick={() => handleStatusChange(s.id)}
              disabled={updatingStatus || vehicle.status === s.id}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all border text-left group ${vehicle.status === s.id
                  ? 'bg-ink border-ink text-white shadow-sm'
                  : 'bg-white border-line-2 text-ink-4 hover:border-primary/20 hover:text-primary hover:bg-bg'
                }`}
            >
              <s.icon size={16} className={vehicle.status === s.id ? 'text-white' : 'group-hover:text-primary transition-colors'} />
              <span className="text-xs font-medium">{s.label}</span>
              {updatingStatus && vehicle.status === s.id && <Loader2 size={14} className="ml-auto animate-spin" />}
              {vehicle.status === s.id && !updatingStatus && <CheckCircle2 size={14} className="ml-auto text-primary" />}
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-6 border-line-2 shadow-sm">
        <h4 className="type-th mb-6">Operator Fulfillment</h4>
        {driver ? (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar initials={driver.initials} src={driver.image} size="lg" online={driver.onDuty} className="ring-2 ring-bg" />
              </div>
              <div>
                <p className="text-sm font-medium text-ink">{driver.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="primary-light" className="font-medium">Assigned</Badge>
                  {driver.rating != null && (
                    <span className="flex items-center gap-1 type-action text-warning"><Star size={12} fill="currentColor" /> {driver.rating} Avg</span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-bg rounded-xl border border-line-2">
                <span className="text-xs text-ink-4 flex items-center gap-2"><Phone size={14} /> Terminal</span>
                <span className="text-xs font-medium text-ink">{driver.phone || driver.contact || '—'}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-bg rounded-xl border border-line-2">
                <span className="text-xs text-ink-4 flex items-center gap-2"><Package size={14} /> Assignments</span>
                <span className="text-xs font-medium text-ink">{driver.totalTrips ?? 0} Trips</span>
              </div>
            </div>

            <Button variant="outline" icon={User} className="w-full h-11 rounded-lg type-body-sm font-semibold" onClick={() => setAssigning(true)}>Reassign Operator</Button>
          </div>
        ) : (
          <div className="text-center py-10">
            <div className="w-20 h-20 bg-bg rounded-3xl flex items-center justify-center text-ink-4 mx-auto mb-6 border-2 border-dashed border-line shadow-inner group hover:border-primary/30 transition-all">
              <User size={32} className="group-hover:text-primary transition-colors" />
            </div>
            <p className="text-base font-semibold text-ink mb-1.5">Operator Vacancy</p>
            <p className="text-xs text-ink-3 mb-10 font-medium px-4">Select a driver and save to assign this vehicle.</p>
            <Button variant="primary" icon={User} className="w-full h-11 rounded-lg type-body-sm font-semibold" onClick={() => setAssigning(true)}>Assign Driver</Button>
          </div>
        )}
      </Card>

      {assigning && (
        <div className="fixed inset-0 bg-ink/55 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <Card className="w-full max-w-2xl bg-white rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 border-line-2 ring-1 ring-ink/5 flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-line-2 flex items-start justify-between bg-white shrink-0">
              <div>
                <h3 className="type-panel-title">Assign Driver</h3>
                <p className="type-caption text-ink-3 mt-1">Vehicle <span className="text-primary font-medium">{vehicle.plate}</span> · select a driver, then save</p>
              </div>
              <button
                type="button"
                onClick={() => setAssigning(false)}
                disabled={Boolean(assigningDriverId)}
                className="w-10 h-10 rounded-lg bg-bg border border-line-2 flex items-center justify-center text-ink-4 hover:text-urgent hover:border-urgent/20 transition-all"
                aria-label="Close operator assignment"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-2 overflow-y-auto flex-1 min-h-0">
              {driversLoading ? (
                <div className="py-12 flex flex-col items-center gap-2 text-ink-4">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm">Loading drivers…</p>
                </div>
              ) : assignmentOptions.length === 0 ? (
                <p className="text-sm text-center text-ink-4 py-12">No drivers available.</p>
              ) : (
                assignmentOptions.map((d: any) => {
                  const assignedVehicle = getAssignedVehicle(d.id);
                  const unavailable = isDriverUnavailable(d);
                  const isCurrent = d.id === vehicle.assignedDriverId;
                  const isSelected = selectedDriverId === d.id;

                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => {
                        if (unavailable || isCurrent) return;
                        setSelectedDriverId(d.id);
                      }}
                      disabled={unavailable || isCurrent}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-primary/5 border-primary ring-1 ring-primary/25'
                          : isCurrent
                            ? 'bg-accent/5 border-accent ring-1 ring-accent/20'
                            : unavailable
                              ? 'bg-bg/50 border-line-2 opacity-60 cursor-not-allowed'
                              : 'bg-white border-line-2 hover:border-primary/30 hover:bg-bg hover:shadow-sm group'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <Avatar initials={d.initials} src={d.image} size="md" className={isSelected || isCurrent ? 'ring-2 ring-primary' : ''} />
                          {!unavailable && <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${d.status === 'available' ? 'bg-accent' : d.status === 'off_duty' ? 'bg-ink-4' : 'bg-warning'}`} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-semibold text-ink">{d.name}</p>
                            {isCurrent && <Badge variant="accent" className="text-xs py-0 h-4">CURRENT</Badge>}
                          </div>
                          <div className="flex items-center gap-3 type-caption text-ink-4">
                            {d.rating != null && (
                              <span className="flex items-center gap-1.5"><Star size={12} className="text-warning fill-warning" /> {d.rating}</span>
                            )}
                            <span className="flex items-center gap-1.5"><Navigation size={12} /> {d.totalTrips ?? 0} Trips</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {assignedVehicle && !isCurrent ? (
                          <div className="text-right">
                            <p className="text-xs font-medium text-ink-4 uppercase tracking-wider mb-1">Assigned Unit</p>
                            <Badge variant="neutral">{assignedVehicle.plate}</Badge>
                          </div>
                        ) : (
                          <div className="text-right">
                            <p className="text-xs font-medium text-ink-4 uppercase tracking-wider mb-1">Status</p>
                            {unavailable ? (
                              <span className="text-xs font-semibold text-urgent">En Route</span>
                            ) : (
                              <span className={`text-xs font-semibold ${isCurrent ? 'text-accent' : isSelected ? 'text-primary' : 'text-ink-3 group-hover:text-primary'}`}>
                                {isCurrent ? 'Assigned' : isSelected ? 'Selected' : 'Select'}
                              </span>
                            )}
                          </div>
                        )}
                        {isSelected && !isCurrent && <CheckCircle2 size={18} className="text-primary" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div className="px-6 py-4 border-t border-line-2 bg-bg/30 flex items-center justify-end gap-3 shrink-0">
              <Button variant="ghost" type="button" onClick={() => setAssigning(false)} disabled={Boolean(assigningDriverId)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                type="button"
                disabled={
                  !selectedDriverId ||
                  selectedDriverId === vehicle.assignedDriverId ||
                  Boolean(assigningDriverId)
                }
                onClick={() => void handleConfirm()}
              >
                {assigningDriverId ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-1.5" />
                    Saving…
                  </>
                ) : (
                  'Save assignment'
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
};
