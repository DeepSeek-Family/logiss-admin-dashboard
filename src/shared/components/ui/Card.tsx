import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  hover = false,
  onClick,
  ...props
}) => {
  const hasOverflowClass = className.includes("overflow-") || className.includes("!overflow-");
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-line-2 ${hasOverflowClass ? "" : "overflow-hidden"} ${hover ? "transition-colors duration-150 hover:border-line cursor-pointer" : ""} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
