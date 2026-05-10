import React from 'react';
import { Card } from './Card';
import { TrendingUp, TrendingDown } from 'lucide-react';

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
    <Card className="p-6 relative">
      <div className="flex justify-between items-start mb-1">
        <span className="text-xs font-bold text-ink-4 uppercase tracking-wider">{label}</span>
        {Icon && (
          <div className={`p-1.5 rounded-lg ${accents[accent] || accents.primary}`}>
            <Icon size={16} />
          </div>
        )}
      </div>
      <div className="text-2xl font-extrabold font-display text-ink mb-1">{value}</div>
      {(sub || trend) && (
        <div className="flex items-center gap-2">
          {trend && (
            <span className={`flex items-center text-xs font-bold ${trend.startsWith('+') ? 'text-accent' : 'text-urgent'}`}>
              {trend.startsWith('+') ? <TrendingUp size={10} className="mr-0.5" /> : <TrendingDown size={10} className="mr-0.5" />}
              {trend}
            </span>
          )}
          {sub && <span className="text-xs font-medium text-ink-4">{sub}</span>}
        </div>
      )}
    </Card>
  );
};
