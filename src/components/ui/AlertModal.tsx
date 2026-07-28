import React from "react";
import { Button } from "./Button";

export type AlertModalVariant = "danger" | "warning" | "info" | "success";

export interface AlertModalProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  message?: React.ReactNode;
  icon?: React.ReactNode;
  variant?: AlertModalVariant;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  confirmDisabled?: boolean;
  children?: React.ReactNode;
}

const variantStyles: Record<AlertModalVariant, { iconBg: string; confirmVariant: "danger" | "primary" }> = {
  danger: {
    iconBg: "bg-rose-500/15 border-rose-500/30 text-rose-500",
    confirmVariant: "danger",
  },
  warning: {
    iconBg: "bg-amber-500/15 border-amber-500/30 text-amber-400",
    confirmVariant: "primary",
  },
  info: {
    iconBg: "bg-accent-purple/15 border-accent-purple/30 text-accent-purple",
    confirmVariant: "primary",
  },
  success: {
    iconBg: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
    confirmVariant: "primary",
  },
};

export const AlertModal: React.FC<AlertModalProps> = React.memo(
  ({
    isOpen,
    title,
    subtitle,
    message,
    icon,
    variant = "danger",
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    isLoading = false,
    onConfirm,
    onCancel,
    confirmDisabled = false,
    children,
  }) => {
    if (!isOpen) return null;

    const style = variantStyles[variant];

    return (
      <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-150 select-none'>
        <div className='w-full max-w-md bg-surface border border-surface-border rounded-2xl shadow-2xl p-6 space-y-4'>
          <div className='flex items-center gap-3'>
            {icon && <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${style.iconBg}`}>{icon}</div>}
            <div className='min-w-0 flex-1'>
              <h2 className='text-base font-bold text-slate-100'>{title}</h2>
              {subtitle && (
                <p className='text-xs text-slate-400 font-mono mt-0.5 truncate max-w-70' title={subtitle}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {message && <div className='text-xs text-slate-300 leading-relaxed'>{message}</div>}

          {children}

          <div className='flex justify-end gap-2 pt-2 border-t border-surface-border'>
            <Button variant='secondary' onClick={onCancel} disabled={isLoading}>
              {cancelLabel}
            </Button>

            {!confirmDisabled && (
              <Button variant={style.confirmVariant} onClick={onConfirm} isLoading={isLoading}>
                {confirmLabel}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  },
);

AlertModal.displayName = "AlertModal";
