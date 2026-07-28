import React from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "../ui/Button";

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = React.memo(({
  title,
  subtitle,
  onBack,
  rightAction,
  className = "",
}) => {
  return (
    <div className={`flex items-center justify-between border-b border-surface-border pb-6 ${className}`}>
      <div className="flex items-center gap-4">
        {onBack && (
          <Button variant="outline" size="icon" onClick={onBack} title="Go back">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        )}
        <div>
          <h1 className="text-xl font-bold text-slate-100">{title}</h1>
          {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {rightAction && <div>{rightAction}</div>}
    </div>
  );
});

PageHeader.displayName = "PageHeader";
