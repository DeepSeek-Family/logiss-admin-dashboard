import React, { useState } from 'react';
import { Search, ChevronLeft, ChevronRight, Truck, Users, Clock } from 'lucide-react';
import { Card, Avatar } from '@/shared/components/ui';
import { DAYS, TODAY_IDX, getShift, shiftStyle } from '../utils/scheduleHelpers';

interface ShiftScheduleTabProps {
  drivers: any[];
  vehicles: any[];
  setEditingCell: (cell: any) => void;
}

export const ShiftScheduleTab: React.FC<ShiftScheduleTabProps> = ({
  drivers,
  vehicles,
  setEditingCell,
}) => {
  const [scheduleActiveTab, setScheduleActiveTab] = useState('driver');
  const [scheduleSearchTerm, setScheduleSearchTerm] = useState('');
  const [weekOffset, setWeekOffset] = useState(0);

  // Process week dates for schedule
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - TODAY_IDX + weekOffset * 7);
  const weekDates = DAYS.map((_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const isToday = (d: Date) => {
    const t = new Date();
    return d.getDate() === t.getDate() && d.getMonth() === t.getMonth();
  };

  // Fleet structure mapping for schedule
  const scheduleFleet = (vehicles || []).map((v: any) => ({
    id: v.id,
    plate: v.plate,
    make: v.make,
    type: v.type,
    image: v.image,
    status: v.status === 'maintenance' || v.status === 'urgent' ? 'maintenance' : 'active',
  }));

  const scheduleItems = scheduleActiveTab === 'driver' ? (drivers || []) : scheduleFleet;
  const filteredSchedule = scheduleItems.filter((item: any) => {
    const q = scheduleSearchTerm.toLowerCase();
    if (scheduleActiveTab === 'driver') return item.name.toLowerCase().includes(q) || item.vehicle?.plate?.toLowerCase().includes(q);
    return item.plate.toLowerCase().includes(q) || item.make.toLowerCase().includes(q);
  });

  const onDutyCount = (drivers || []).filter((d: any) => d?.onDuty).length;
  const offDutyCount = (drivers || []).length - onDutyCount;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset(w => w - 1)}
            className="w-8 h-8 rounded-xl border border-line-2 bg-white hover:bg-bg flex items-center justify-center text-ink-3 hover:text-ink transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="px-4 py-2 bg-white border border-line-2 rounded-xl text-xs font-medium text-ink min-w-[130px] text-center shadow-sm">
            {weekOffset === 0 ? 'This Week' : weekOffset === 1 ? 'Next Week' : weekOffset === -1 ? 'Last Week' : `Week ${weekOffset > 0 ? '+' : ''}${weekOffset}`}
          </div>
          <button
            onClick={() => setWeekOffset(w => w + 1)}
            className="w-8 h-8 rounded-xl border border-line-2 bg-white hover:bg-bg flex items-center justify-center text-ink-3 hover:text-ink transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Users, label: 'Total Drivers', value: (drivers || []).length, color: 'bg-primary-light text-primary' },
          { icon: Users, label: 'On Duty Today', value: onDutyCount, color: 'bg-accent-light text-accent' },
          { icon: Users, label: 'Off Duty Today', value: offDutyCount, color: 'bg-bg border text-ink-3' },
          { icon: Truck, label: 'Fleet Vehicles', value: (vehicles || []).length, color: 'bg-primary-light text-primary' },
        ].map(s => (
          <Card key={s.label} className="p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color}`}>
              <s.icon size={18} />
            </div>
            <div>
              <p className="text-xs text-ink-4">{s.label}</p>
              <p className="text-2xl font-semibold text-ink mt-0.5">{s.value}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line-2/50 pb-3">
        <div className="flex bg-bg/60 p-0.5 rounded-xl border border-line-2/45 w-fit">
          {[
            { id: 'driver', label: 'Driver Schedule', icon: Users },
            { id: 'fleet', label: 'Fleet Schedule', icon: Truck },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setScheduleActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition-all ${
                scheduleActiveTab === tab.id
                  ? 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-primary'
                  : 'text-ink-4 hover:text-ink'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4" />
          <input
            className="pl-9 pr-4 py-2.5 text-xs font-medium bg-bg/60 focus:bg-white rounded-xl w-56 focus:ring-4 focus:ring-primary/10 outline-none transition-all"
            placeholder={scheduleActiveTab === 'driver' ? 'Search driver…' : 'Search plate…'}
            value={scheduleSearchTerm}
            onChange={e => setScheduleSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="grid border-b border-line-2/40 bg-bg/20" style={{ gridTemplateColumns: '220px repeat(7, 1fr)' }}>
          <div className="px-4 py-3 border-r border-line-2/30">
            <p className="text-xs text-ink-4">
              {scheduleActiveTab === 'driver' ? 'Driver' : 'Vehicle'}
            </p>
          </div>
          {weekDates.map((d, i) => (
            <div
              key={i}
              className={`px-3 py-3 text-center border-r border-line-2/30 last:border-r-0 ${isToday(d) ? 'bg-primary-tint/20' : ''}`}
            >
              <p className={`text-xs font-medium ${isToday(d) ? 'text-primary' : 'text-ink-4'}`}>
                {DAYS[i]}
              </p>
              <p className={`text-sm font-semibold mt-0.5 ${isToday(d) ? 'text-primary' : 'text-ink'}`}>
                {d.getDate()}
              </p>
              {isToday(d) && (
                <div className="w-1.5 h-1.5 rounded-full bg-primary mx-auto mt-1" />
              )}
            </div>
          ))}
        </div>

        <div className="divide-y divide-line-2/40">
          {filteredSchedule.length === 0 && (
            <div className="py-16 text-center text-sm text-ink-4">
              No results match your search.
            </div>
          )}

          {filteredSchedule.map((item: any, idx: number) => (
            <div
              key={item.id}
              className="grid hover:bg-bg/30 transition-colors group"
              style={{ gridTemplateColumns: '220px repeat(7, 1fr)' }}
            >
              <div className="px-4 py-3 border-r border-line-2/30 flex items-center gap-3 bg-white group-hover:bg-bg/10 transition-colors">
                {scheduleActiveTab === 'driver' ? (
                  <>
                    <Avatar initials={item.initials} size="sm" online={item.onDuty} />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-ink truncate">{item.name}</p>
                      <p className="text-xs text-ink-4 truncate">{item.vehicle?.type}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 border overflow-hidden ${
                      item.status === 'active' ? 'bg-accent-light text-accent border-accent/10' : 'bg-urgent-light text-urgent border-urgent/10'
                    }`}>
                      {item.image ? (
                        <img src={item.image} alt={item.plate} className="w-full h-full object-cover" />
                      ) : (
                        <Truck size={15} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-ink truncate">{item.plate}</p>
                      <p className="text-xs text-ink-4 truncate">{item.make} · {item.type}</p>
                    </div>
                  </>
                )}
              </div>

              {weekDates.map((d, dayIdx) => {
                const shift = getShift(idx, dayIdx);
                return (
                  <div
                    key={dayIdx}
                    onClick={() => setEditingCell({ item, date: d })}
                    className={`px-2 py-2 border-r border-line-2/30 last:border-r-0 min-h-[72px] flex flex-col justify-center cursor-pointer hover:bg-bg transition-colors ${
                      isToday(d) ? 'bg-primary-tint/10' : ''
                    }`}
                  >
                    {shift ? (
                      <div className={`rounded-lg border px-2 py-1.5 text-xs font-medium leading-tight ${shiftStyle[shift.color]}`}>
                        <div className="flex items-center gap-1 mb-1 opacity-70">
                          <Clock size={9} />
                          <span className="whitespace-pre-line text-[10px]">{shift.time}</span>
                        </div>
                        <p className="font-medium">{shift.label}</p>
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <span className="text-xs text-ink-4">Off</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-4 px-1">
        <div className="flex flex-wrap items-center gap-5">
          {[
            { color: 'bg-primary', label: 'Heavy (8+ Trips)' },
            { color: 'bg-warning', label: 'Split (4+ Trips)' },
            { color: 'bg-accent', label: 'Normal (5+ Trips)' },
            { color: 'bg-line', label: 'Off Day' },
            { color: 'bg-ink-4', label: 'Leave / Maintenance' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-sm ${l.color}`} />
              <span className="text-xs text-ink-4">{l.label}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-ink-4">Last sync: Just now</p>
      </div>
    </div>
  );
};
