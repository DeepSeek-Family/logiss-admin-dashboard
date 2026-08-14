import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', hover = false, onClick, ...props }) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border border-line overflow-hidden transition-all duration-200 ${hover ? 'hover:border-primary/30 cursor-pointer' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
