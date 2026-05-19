import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export type MultiCalendarProps = {
  selected?: Date[];
  onSelect?: (days: Date[]) => void;
  className?: string;
};

export function MultiCalendar({ selected = [], onSelect, className }: MultiCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const days = Array.from({ length: 42 }, (_, i) => {
    const day = i - firstDay + 1;
    if (day > 0 && day <= daysInMonth) {
      return new Date(year, month, day);
    }
    return null;
  });

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const toggleDate = (date: Date) => {
    if (!onSelect) return;
    const dateStr = date.toDateString();
    const existingIndex = selected.findIndex(d => d.toDateString() === dateStr);
    
    if (existingIndex >= 0) {
      onSelect(selected.filter((_, i) => i !== existingIndex));
    } else {
      onSelect([...selected, date].sort((a, b) => a.getTime() - b.getTime()));
    }
  };

  const isSelected = (date: Date) => selected.some(d => d.toDateString() === date.toDateString());
  const isToday = (date: Date) => date.toDateString() === new Date().toDateString();

  return (
    <div className={`p-4 bg-white border border-line-2 rounded-xl shadow-sm select-none ${className || ''}`}>
      <div className="flex justify-between items-center mb-4">
        <button type="button" onClick={() => setCurrentMonth(new Date(year, month - 1))} className="p-1.5 hover:bg-bg rounded-md transition-all text-ink-3 hover:text-ink">
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-semibold text-ink">
          {monthNames[month]} {year}
        </span>
        <button type="button" onClick={() => setCurrentMonth(new Date(year, month + 1))} className="p-1.5 hover:bg-bg rounded-md transition-all text-ink-3 hover:text-ink">
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2 text-center">
        {dayNames.map(day => (
          <div key={day} className="text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em]">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((date, i) => {
          if (!date) return <div key={`empty-${i}`} className="h-8 w-8" />;
          
          const isSel = isSelected(date);
          const isTod = isToday(date);
          const isPast = date < new Date(new Date().setHours(0,0,0,0));

          return (
            <button
              key={i}
              type="button"
              onClick={() => !isPast && toggleDate(date)}
              disabled={isPast}
              className={`
                h-8 w-8 rounded-md text-xs font-medium flex items-center justify-center transition-all
                ${isSel ? 'bg-primary text-white shadow-md' : 'text-ink hover:bg-bg'}
                ${isTod && !isSel ? 'border border-primary/30 text-primary' : ''}
                ${isPast ? 'opacity-30 cursor-not-allowed hover:bg-transparent' : 'cursor-pointer'}
              `}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
