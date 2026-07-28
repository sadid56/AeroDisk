import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "subtle" | "ghost" | "interactive";
  padding?: "none" | "sm" | "md" | "lg";
  selected?: boolean;
  as?: "div" | "button" | "section";
  disabled?: boolean;
}

const variantStyles: Record<NonNullable<CardProps["variant"]>, string> = {
  default: "bg-surface/60 border border-surface-border rounded-2xl shadow-sm",
  subtle: "bg-background/60 border border-surface-border rounded-2xl",
  ghost: "bg-transparent border border-surface-border/60 rounded-2xl",
  interactive:
    "bg-background/60 border border-surface-border rounded-2xl shadow-sm hover:bg-surface-hover hover:border-slate-500 transition-all cursor-pointer text-left",
};

const paddingStyles: Record<NonNullable<CardProps["padding"]>, string> = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6 sm:p-8",
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      className = "",
      variant = "default",
      padding = "md",
      selected = false,
      as = "div",
      disabled = false,
      ...props
    },
    ref
  ) => {
    const selectedStyle = selected
      ? "bg-accent-purple/20 border-accent-purple text-slate-100 font-bold shadow-md"
      : "";

    const Component = as as any;

    return (
      <Component
        ref={ref}
        disabled={disabled}
        className={`${variantStyles[variant]} ${paddingStyles[padding]} ${selectedStyle} ${className}`}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Card.displayName = "Card";
