import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { MultiCalendar } from './MultiCalendar';

export type MultiDatePickerProps = {
  selected?: Date[];
  onSelect?: (days: Date[]) => void;
};

export function MultiDatePicker({ selected = [], onSelect }: MultiDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const removeDate = (dateToRemove: Date) => {
    if (onSelect) {
      onSelect(selected.filter(d => d.getTime() !== dateToRemove.getTime()));
    }
  };

  const formatDisplay = () => {
    if (selected.length === 0) return 'Select dates...';
    if (selected.length === 1) return selected[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${selected.length} dates selected`;
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-1.5 bg-white border border-line-2 rounded-lg text-sm font-semibold text-ink outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary transition-all h-9 shadow-sm flex items-center justify-between hover:bg-bg/50"
      >
        <span className={selected.length === 0 ? 'text-ink-4 font-normal' : ''}>
          {formatDisplay()}
        </span>
        <CalendarIcon size={16} className="text-ink-3" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200 min-w-[280px]">
          <div className="shadow-2xl border border-line-2 bg-white rounded-xl overflow-hidden flex flex-col">
            <MultiCalendar selected={selected} onSelect={onSelect} className="!border-none !shadow-none !rounded-none !mb-0" />
            <div className="px-4 py-3 border-t border-line-2 bg-gray-50 flex justify-end">
              <button 
                type="button" 
                onClick={() => setIsOpen(false)} 
                className="bg-primary text-white text-xs font-medium px-4 py-1.5 rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
