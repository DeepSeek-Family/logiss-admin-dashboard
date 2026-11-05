import React from "react";

interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyState = ({ icon: Icon, title, description, action }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
    <div className="w-10 h-10 bg-bg rounded-lg border border-line-2 flex items-center justify-center text-ink-4 mb-4">
      {Icon && <Icon size={20} />}
    </div>
    <h3 className="text-base font-semibold text-ink mb-1">{title}</h3>
    <p className="text-sm text-ink-3 max-w-xs">{description}</p>
    {action ? <div className="mt-6">{action}</div> : null}
  </div>
);
