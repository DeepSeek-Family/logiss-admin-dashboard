import React from 'react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const SectionHeader = ({ title, subtitle, action }: SectionHeaderProps) => (
  <div className="flex items-center justify-between mb-4">
    <div>
      <h2 className="text-lg font-bold font-display text-ink">{title}</h2>
      {subtitle && <p className="text-xs text-ink-3">{subtitle}</p>}
    </div>
    {action && (
      <div className="text-sm font-semibold text-primary hover:underline cursor-pointer">
        {action}
      </div>
    )}
  </div>
);
