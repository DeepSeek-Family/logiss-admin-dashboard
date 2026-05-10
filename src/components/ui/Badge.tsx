import React from 'react';

interface BadgeProps {
  variant?: string;
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const Badge = ({ variant = 'neutral', dot = false, children, className = '' }: BadgeProps) => {
  const variants: { [key: string]: string } = {
    neutral: 'bg-bg text-ink-3 border-line',
    primary: 'bg-primary-light text-primary border-primary/10',
    'primary-light': 'bg-primary-light/50 text-primary border-primary/10',
    accent: 'bg-accent-light text-accent border-accent/10',
    warning: 'bg-warning-light text-warning border-warning/10',
    urgent: 'bg-urgent-light text-urgent border-urgent/10',
    white: 'bg-white text-primary border-white',
    solid_accent: 'bg-accent text-white border-accent',
    solid_primary: 'bg-primary text-white border-primary',
    solid_warning: 'bg-warning text-white border-warning',
    solid_urgent: 'bg-urgent text-white border-urgent',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${variants[variant] || variants.neutral} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${variant.startsWith('solid') ? 'bg-white' : (variant === 'accent' || variant === 'solid_accent' ? 'bg-accent' : (variant === 'primary' ? 'bg-primary' : 'bg-current'))}`}></span>}
      {children}
    </span>
  );
};
