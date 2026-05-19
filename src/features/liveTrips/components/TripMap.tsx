import React from 'react';
import { Plus, Minus } from 'lucide-react';

interface TripMapProps {
  drivers: any[];
  trips: any[];
  selectedDriver: any;
  setSelectedTripId: (id: string) => void;
}

export const TripMap: React.FC<TripMapProps> = ({
  drivers,
  trips,
  selectedDriver,
  setSelectedTripId
}) => {
  return (
    <div className="relative bg-gradient-to-br from-primary-light to-accent-light rounded-xl border border-line-2 overflow-hidden min-h-[260px]">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 500" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(41, 105, 205, 0.05)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        <line x1="0" y1="175" x2="800" y2="175" stroke="white" strokeWidth="4" strokeOpacity="0.4" />
        <line x1="0" y1="325" x2="800" y2="325" stroke="white" strokeWidth="4" strokeOpacity="0.4" />
        <line x1="240" y1="0" x2="240" y2="500" stroke="white" strokeWidth="4" strokeOpacity="0.4" />
        <line x1="560" y1="0" x2="560" y2="500" stroke="white" strokeWidth="4" strokeOpacity="0.4" />
        <rect x="40" y="50" width="120" height="75" rx="4" fill="rgba(255,255,255,0.1)" />
        <rect x="360" y="200" width="80" height="50" rx="4" fill="rgba(255,255,255,0.1)" />
        <rect x="600" y="75" width="160" height="150" rx="4" fill="rgba(255,255,255,0.1)" />
        <rect x="80" y="350" width="96" height="90" rx="4" fill="rgba(255,255,255,0.1)" />
        <rect x="320" y="375" width="120" height="50" rx="4" fill="rgba(255,255,255,0.1)" />
        <path d="M 240 175 Q 400 50 560 325" fill="none" stroke="#0F6E56" strokeWidth="4" strokeLinecap="round" strokeOpacity="0.3" />
        <path d="M 240 175 Q 400 50 560 325" fill="none" stroke="white" strokeWidth="2" strokeDasharray="4 4" strokeLinecap="round" />
        <g transform="translate(560, 325)">
          <circle r="8" fill="#A32D2D" />
          <circle r="12" fill="none" stroke="#A32D2D" strokeWidth="2" strokeOpacity="0.3">
            <animate attributeName="r" from="8" to="16" dur="1.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="0.3" to="0" dur="1.5s" repeatCount="indefinite" />
          </circle>
        </g>
      </svg>

      <div className="absolute inset-0 pointer-events-none">
        {(drivers || []).filter((d: any) => d?.onDuty).map((driver: any, index: number) => {
          const isSelected = selectedDriver?.id === driver?.id;
          const left = driver?.id === 'DRV-2024-8421' ? '30%' : index === 1 ? '70%' : index === 2 ? '15%' : '85%';
          const top = driver?.id === 'DRV-2024-8421' ? '35%' : index === 1 ? '20%' : index === 2 ? '80%' : '75%';
          const status = driver?.id === 'DRV-2024-8421' ? 'in_trip' : index === 3 ? 'break' : 'available';
          const statusColor = (s: string) => s === 'in_trip' ? 'bg-accent' : s === 'break' ? 'bg-warning' : 'bg-primary';
          return (
            <div
              key={driver?.id || index}
              className={`absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 ${statusColor(status)} rounded-full border-2 border-white shadow-lg flex items-center justify-center text-xs font-medium text-white pointer-events-auto cursor-pointer group transition-all duration-300 ${isSelected ? 'scale-125 ring-4 ring-white z-10' : ''}`}
              style={{ left, top }}
              onClick={() => {
                const t = (trips || []).find((tr: any) => tr?.driverId === driver?.id && ['in_trip', 'en_route', 'arrived', 'assigned'].includes(tr?.status));
                if (t) setSelectedTripId(t.id);
              }}
            >
              {driver?.initials || '?'}
              {status === 'in_trip' && <div className="absolute inset-0 rounded-full pulse-dot" />}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-ink text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-xl">
                {driver?.name || 'Unknown'} · {status === 'in_trip' ? 'In Trip' : status === 'break' ? 'Break' : 'Available'}
              </div>
            </div>
          );
        })}
      </div>

      <div className="absolute top-3 right-3 flex flex-col gap-1">
        <button className="w-7 h-7 bg-white rounded-lg border border-line-2 flex items-center justify-center text-ink hover:bg-bg shadow-sm"><Plus size={14} /></button>
        <button className="w-7 h-7 bg-white rounded-lg border border-line-2 flex items-center justify-center text-ink hover:bg-bg shadow-sm"><Minus size={14} /></button>
      </div>
    </div>
  );
};
