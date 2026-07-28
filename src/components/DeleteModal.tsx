import React from 'react';
import { useProtectedPath } from '../hooks/useProtectedPath';
import { AlertTriangle, Trash2, Loader2, ShieldAlert } from 'lucide-react';
import { FileNode } from '../types';

interface DeleteModalProps {
  node: FileNode | null;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

export const DeleteModal: React.FC<DeleteModalProps> = React.memo(({
  node,
  onConfirm,
  onCancel,
  isDeleting,
}) => {
  const { isProtected } = useProtectedPath(node?.path);

  if (!node) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-md bg-surface border border-surface-border rounded-2xl shadow-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-500 flex items-center justify-center shrink-0">
            {isProtected ? <ShieldAlert className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">
              {isProtected ? 'Protected System Directory' : 'Move Item to Trash?'}
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5 truncate max-w-[280px]" title={node.path}>
              {node.name}
            </p>
          </div>
        </div>

        {isProtected ? (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs leading-relaxed space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              Deletion Disabled
            </p>
            <p className="opacity-90">
              This path is a critical system directory (<span className="font-mono">{node.path}</span>). Deletion is disabled to protect system integrity.
            </p>
          </div>
        ) : (
          <p className="text-xs text-slate-300 leading-relaxed">
            Are you sure you want to move <span className="font-semibold text-slate-100">{node.name}</span> to the system trash? This item can be restored from your trash bin.
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-surface-border">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl bg-surface border border-surface-border text-slate-300 hover:bg-surface-hover text-xs font-medium cursor-pointer"
          >
            Cancel
          </button>

          {!isProtected && (
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-600/20 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Confirm Delete</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
});
