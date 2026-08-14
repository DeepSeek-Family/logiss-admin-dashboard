import React from 'react';
import { Card } from './Card';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ElementType;
  accent?: 'primary' | 'accent' | 'warning' | 'urgent';
  trend?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, sub, icon: Icon, accent = 'primary', trend }) => {
  const accents = {
    primary: 'text-primary bg-primary-light',
    accent: 'text-accent bg-accent-light',
    warning: 'text-warning bg-warning-light',
    urgent: 'text-urgent bg-urgent-light',
  };

  return (
    <Card className="p-4 relative border-line">
      <div className="flex justify-between items-start mb-2">
        <span className="type-label text-ink-3">{label}</span>
        {Icon && (
          <div className={`p-1.5 rounded-lg ${accents[accent] || accents.primary}`}>
            <Icon size={16} />
          </div>
        )}
      </div>
      <div className="text-xl font-semibold text-ink tabular-nums">{value}</div>
      {(sub || trend) && (
        <div className="flex items-center gap-2 mt-1">
          {trend && <span className="text-xs font-medium text-ink-3">{trend}</span>}
          {sub && <span className="text-xs font-medium text-ink-3">{sub}</span>}
        </div>
      )}
    </Card>
  );
};
