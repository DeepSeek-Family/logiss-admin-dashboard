import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', hover = false, onClick, ...props }) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.02),0_1px_3px_rgb(0,0,0,0.01)] overflow-hidden transition-all duration-300 ${hover ? 'hover:shadow-[0_12px_40px_rgba(0,0,0,0.04)] cursor-pointer' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
