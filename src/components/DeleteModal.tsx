import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { FileNode } from '../types';
import { formatBytes, truncate } from '../utils/formatters';

interface DeleteModalProps {
  node: FileNode | null;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

export const DeleteModal: React.FC<DeleteModalProps> = ({
  node,
  onConfirm,
  onCancel,
  isDeleting = false,
}) => {
  if (!node) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-surface border border-surface-border rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-surface-hover transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <h3 className="text-base font-bold text-slate-100">
            Move &quot;{truncate(node.name, 28)}&quot; to Trash?
          </h3>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            This item and all nested files will be moved to the Trash/Recycle bin. This will free up{' '}
            <span className="font-mono font-bold text-accent-purple">{formatBytes(node.size)}</span> of disk space.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-background border border-surface-border text-xs font-mono text-slate-400 truncate">
          {node.path}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl bg-surface border border-surface-border text-slate-300 font-medium text-xs hover:bg-surface-hover hover:text-white transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs shadow-lg shadow-rose-600/25 transition-all flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isDeleting ? 'Deleting...' : 'Move to Trash'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
