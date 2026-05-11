import React from 'react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const SectionHeader = ({ title, subtitle, action }: SectionHeaderProps) => (
  <div className="flex items-center justify-between mb-4">
    <div>
      <h2 className="type-section-title">{title}</h2>
      {subtitle && <p className="type-caption text-ink-3">{subtitle}</p>}
    </div>
    {action && (
      <div className="type-body-sm font-semibold text-primary hover:underline cursor-pointer">
        {action}
      </div>
    )}
  </div>
);
