import React from 'react';

interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description: string;
}

export const EmptyState = ({ icon: Icon, title, description }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center p-12 text-center">
    <div className="w-16 h-16 bg-bg rounded-full flex items-center justify-center text-ink-4 mb-4">
      {Icon && <Icon size={32} />}
    </div>
    <h3 className="text-base font-bold text-ink mb-1">{title}</h3>
    <p className="text-sm text-ink-3 max-w-xs">{description}</p>
  </div>
);
