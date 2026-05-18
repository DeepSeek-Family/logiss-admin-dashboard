import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'accent' | 'ghost' | 'outline' | 'danger' | 'primary-light';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ElementType;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  children,
  className = '',
  ...props
}) => {
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-dark',
    accent: 'bg-accent text-white hover:bg-accent-dark',
    ghost: 'bg-transparent text-ink-2 hover:bg-bg',
    outline: 'bg-transparent border border-line text-ink-2 hover:bg-bg',
    danger: 'bg-urgent text-white hover:bg-urgent-dark',
    'primary-light': 'bg-primary-light text-primary hover:bg-primary/20',
  };

  const sizes = {
    sm: 'px-3 py-1.5 type-action',
    md: 'px-4 py-2 type-body-sm',
    lg: 'px-6 py-3 type-body',
  };

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 ${variants[variant] || variants.primary} ${sizes[size]} ${className}`}
      {...props}
    >
      {Icon && <Icon size={size === 'sm' ? 14 : 18} />}
      {children}
    </button>
  );
};
