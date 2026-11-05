import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "accent" | "ghost" | "outline" | "danger" | "primary-light";
  size?: "sm" | "md" | "lg";
  icon?: React.ElementType;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  icon: Icon,
  children,
  className = "",
  ...props
}) => {
  const variants = {
    primary: "bg-primary text-white border border-primary hover:bg-primary-dark",
    accent: "bg-accent text-white border border-accent hover:bg-accent-dark",
    ghost: "bg-transparent text-ink-2 hover:bg-bg",
    outline: "bg-white border border-line text-ink-2 hover:bg-bg hover:border-line",
    danger: "bg-urgent text-white border border-urgent hover:bg-urgent-dark",
    "primary-light": "bg-primary-tint text-primary border border-primary/15 hover:bg-primary-light",
  };

  const sizes = {
    sm: "min-h-8 px-3 py-1.5 type-action",
    md: "min-h-9 px-4 py-2 type-body-sm",
    lg: "min-h-10 px-5 py-2.5 type-body",
  };

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:pointer-events-none disabled:opacity-50 ${variants[variant] || variants.primary} ${sizes[size]} ${className}`}
      {...props}
    >
      {Icon && <Icon size={size === "sm" ? 14 : 18} />}
      {children}
    </button>
  );
};
