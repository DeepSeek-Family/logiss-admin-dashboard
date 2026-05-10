import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', hover = false, onClick, ...props }) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-line-2 overflow-hidden ${hover ? 'hover:border-primary/30 hover:shadow-sm cursor-pointer transition-all' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
