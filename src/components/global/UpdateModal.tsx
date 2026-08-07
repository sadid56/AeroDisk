import React from 'react';
import { Download, X, ArrowUpCircle } from 'lucide-react';
import { Button } from '../ui/Button';

interface UpdateModalProps {
  isOpen: boolean;
  version: string;
  body?: string;
  installing: boolean;
  progressPercent: number;
  onConfirm: () => Promise<void>;
  onSkip: () => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = React.memo(({
  isOpen,
  version,
  body,
  installing,
  progressPercent,
  onConfirm,
  onSkip,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-surface/90 border border-surface-border rounded-2xl shadow-2xl p-6 flex flex-col gap-5 overflow-hidden animate-in zoom-in-95 duration-200 bg-glow">
        
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-purple/20 border border-accent-purple/40 flex items-center justify-center text-accent-purple">
              <ArrowUpCircle className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-text-primary">Update Available</h2>
              <p className="text-[11px] text-text-muted mt-0.5">A new version of HyperDisk is ready (v{version})</p>
            </div>
          </div>
          {!installing && (
            <Button
              variant="outline"
              size="icon"
              onClick={onSkip}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Release Notes */}
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-bold text-text-secondary">Release Notes:</h3>
          <div className="max-h-40 overflow-y-auto p-3.5 bg-background/50 border border-surface-border rounded-xl text-[11px] text-text-muted leading-relaxed font-sans scrollbar-thin scrollbar-thumb-surface-border whitespace-pre-wrap select-text">
            {body || 'This update contains stability improvements, speed optimizations, and bug fixes.'}
          </div>
        </div>

        {/* Progress or Actions */}
        {installing ? (
          <div className="flex flex-col gap-2 pt-2">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-accent-purple animate-pulse">Downloading & Installing...</span>
              <span className="text-text-muted">{progressPercent}%</span>
            </div>
            <div className="w-full h-2.5 bg-background border border-surface-border rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-accent-purple to-accent-blue rounded-full transition-all duration-300 shadow-md"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-[10px] text-text-muted text-center mt-1 leading-snug">
              Please do not close or interrupt the installation. The app will relaunch automatically when finished.
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onSkip}
            >
              Skip this Version
            </Button>
            <Button
              variant="primary"
              onClick={onConfirm}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Update Now
            </Button>
          </div>
        )}

      </div>
    </div>
  );
});
