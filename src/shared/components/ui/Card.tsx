import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', hover = false, onClick, ...props }) => {
  const hasOverflowClass = className.includes('overflow-') || className.includes('!overflow-');
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border border-line ${hasOverflowClass ? '' : 'overflow-hidden'} transition-all duration-200 ${hover ? 'hover:border-primary/30 cursor-pointer' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
