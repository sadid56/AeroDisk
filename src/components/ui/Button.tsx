import React from "react";
import { Loader2 } from "lucide-react";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] text-[var(--btn-primary-text)] font-semibold border border-[var(--btn-primary-border)] shadow-md disabled:hover:bg-[var(--btn-primary-bg)]",
  secondary: "bg-slate-800/80 text-slate-300 border border-slate-700/60 hover:bg-slate-800 hover:text-slate-100",
  outline: "bg-transparent text-slate-400 border border-surface-border hover:bg-surface-hover hover:text-slate-200 hover:border-slate-600",
  ghost: "bg-transparent text-slate-400 hover:text-slate-100 hover:bg-surface-hover border border-transparent",
  danger: "bg-rose-600 hover:bg-rose-500 text-white shadow-sm border border-rose-500/30 disabled:hover:bg-rose-600",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 py-1.5 text-xs rounded-md gap-1.5",
  md: "h-9 px-3.5 py-2 text-xs rounded-lg gap-2 font-medium",
  lg: "h-10 px-4.5 py-2.5 text-sm rounded-lg gap-2.5 font-semibold",
  icon: "h-9 w-9 p-0 rounded-lg text-xs flex items-center justify-center shrink-0 gap-0",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      disabled,
      className = "",
      children,
      type = "button",
      ...props
    },
    ref,
  ) => {
    const isButtonDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isButtonDisabled}
        className={`inline-flex items-center justify-center font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer ${fullWidth ? "w-full" : ""} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {isLoading ? <Loader2 className='w-3.5 h-3.5 animate-spin' /> : leftIcon}
        {children && <span>{children}</span>}
        {!isLoading && rightIcon}
      </button>
    );
  },
);

Button.displayName = "Button";
