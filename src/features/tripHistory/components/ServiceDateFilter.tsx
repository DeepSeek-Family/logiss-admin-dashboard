import React, { useEffect, useRef, useState } from 'react';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { MultiCalendar } from '@/shared/components/ui';

const formatYmd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const parseYmd = (ymd: string): Date | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
};

interface ServiceDateFilterProps {
  /** `YYYY-MM-DD`, or '' for all dates. */
  value: string;
  onChange: (ymd: string) => void;
}

export const ServiceDateFilter: React.FC<ServiceDateFilterProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedDate = parseYmd(value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (days: Date[]) => {
    const added = days.find((d) => d.toDateString() !== selectedDate?.toDateString());
    onChange(added ? formatYmd(added) : '');
    setIsOpen(false);
  };

  const label = selectedDate
    ? selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'All Dates';

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-ink-4 whitespace-nowrap">Date</span>
      <div className="relative" ref={containerRef}>
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          className={`bg-white border rounded-xl py-2 pl-3 pr-9 text-xs font-medium h-9 min-w-[130px] text-left outline-none transition-all ${
            isOpen ? 'border-primary ring-2 ring-primary/10' : 'border-line hover:border-primary/40'
          } ${selectedDate ? 'text-ink' : 'text-ink-3'}`}
        >
          {label}
        </button>
        {selectedDate ? (
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-4 hover:text-urgent"
            title="Clear date"
          >
            <X size={14} />
          </button>
        ) : (
          <CalendarIcon size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-4 pointer-events-none" />
        )}

        {isOpen && (
          <div className="absolute top-full right-0 mt-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200 min-w-[280px]">
            <div className="shadow-2xl border border-line-2 bg-white rounded-xl overflow-hidden flex flex-col">
              <MultiCalendar
                selected={selectedDate ? [selectedDate] : []}
                onSelect={handleSelect}
                disablePast={false}
                initialMonth={selectedDate || undefined}
                className="!border-none !shadow-none !rounded-none !mb-0"
              />
              <div className="px-4 py-3 border-t border-line-2 bg-gray-50 flex justify-between">
                <button
                  type="button"
                  onClick={() => { onChange(''); setIsOpen(false); }}
                  className="text-xs font-medium text-ink-3 hover:text-ink px-2 py-1.5"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => { onChange(formatYmd(new Date())); setIsOpen(false); }}
                  className="bg-primary text-white text-xs font-medium px-4 py-1.5 rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
                >
                  Today
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
