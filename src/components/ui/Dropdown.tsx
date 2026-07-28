import React, { useEffect, useRef } from "react";

export interface DropdownItemProps {
  icon?: React.ReactNode;
  label: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "danger" | "warning";
  disabled?: boolean;
}

export interface DropdownDividerProps {}

export interface DropdownContainerProps {
  x?: number;
  y?: number;
  header?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  width?: string;
  className?: string;
}

export const DropdownItem: React.FC<DropdownItemProps> = ({ icon, label, onClick, variant = "default", disabled = false }) => {
  const variantStyles = {
    default: "text-slate-200 hover:bg-surface-hover hover:text-white",
    danger: "text-rose-400 hover:bg-rose-500/20 hover:text-rose-300",
    warning: "text-amber-400 hover:bg-amber-500/20 hover:text-amber-300",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-xs font-medium transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none ${variantStyles[variant]}`}
    >
      {icon && <span className='shrink-0'>{icon}</span>}
      <span className='truncate'>{label}</span>
    </button>
  );
};

export const DropdownDivider: React.FC = () => {
  return <div className='h-px bg-surface-border my-1' />;
};

export const Dropdown: React.FC<DropdownContainerProps> = ({ x, y, header, onClose, children, width = "w-52", className = "" }) => {
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const style: React.CSSProperties = {};
  if (x !== undefined && y !== undefined) {
    const adjustedX = Math.min(x, window.innerWidth - 220);
    const adjustedY = Math.min(y, window.innerHeight - 280);
    style.left = `${adjustedX}px`;
    style.top = `${adjustedY}px`;
    style.position = "fixed";
  }

  return (
    <div
      ref={menuRef}
      style={style}
      className={`z-50 ${width} bg-surface/95 backdrop-blur-xl border border-surface-border rounded-xl shadow-2xl p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-100 text-xs select-none ${className}`}
    >
      {header && (
        <div className='px-2.5 pb-2 pt-1 border-b border-surface-border text-[11px] font-semibold text-slate-300 truncate mb-1.5'>
          {header}
        </div>
      )}
      {children}
    </div>
  );
};
