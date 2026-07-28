import React, { useEffect, useRef } from 'react';
import { useProtectedPath } from '../hooks/useProtectedPath';
import {
  FolderOpen,
  ExternalLink,
  Copy,
  Trash2,
  FolderPlus,
  ShieldAlert,
  Terminal,
} from 'lucide-react';
import { FileNode } from '../types';

interface ContextMenuProps {
  x: number;
  y: number;
  node: FileNode;
  onClose: () => void;
  onNavigate: (id: number) => void;
  onReveal: (path: string) => void;
  onDelete: (node: FileNode) => void;
  onCopyPath: (path: string) => void;
  onCreateSubfolder?: (node: FileNode) => void;
  onOpenInTerminal: (path: string) => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = React.memo(({
  x,
  y,
  node,
  onClose,
  onNavigate,
  onReveal,
  onDelete,
  onCopyPath,
  onCreateSubfolder,
  onOpenInTerminal,
}) => {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const { isProtected } = useProtectedPath(node.path);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const adjustedX = Math.min(x, window.innerWidth - 220);
  const adjustedY = Math.min(y, window.innerHeight - 280);

  return (
    <div
      ref={menuRef}
      style={{ left: `${adjustedX}px`, top: `${adjustedY}px` }}
      className="fixed z-50 w-52 bg-surface/95 backdrop-blur-xl border border-surface-border rounded-xl shadow-2xl p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-100 text-xs select-none"
    >
      <div className="px-2 py-1 border-b border-surface-border text-[11px] font-semibold text-slate-400 truncate">
        {node.name}
      </div>

      {node.isDirectory && (
        <>
          <button
            onClick={() => {
              onNavigate(node.id);
              onClose();
            }}
            className="w-full px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-slate-200 hover:bg-accent-purple/20 hover:text-white transition-all cursor-pointer font-medium"
          >
            <FolderOpen className="w-4 h-4 text-accent-purple" />
            <span>Open Folder</span>
          </button>

          {onCreateSubfolder && (
            <button
              onClick={() => {
                onCreateSubfolder(node);
                onClose();
              }}
              className="w-full px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-slate-200 hover:bg-accent-purple/20 hover:text-white transition-all cursor-pointer font-medium"
            >
              <FolderPlus className="w-4 h-4 text-accent-purple" />
              <span>Create Subfolder</span>
            </button>
          )}
        </>
      )}

      <button
        onClick={() => {
          onReveal(node.path);
          onClose();
        }}
        className="w-full px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-slate-200 hover:bg-accent-purple/20 hover:text-white transition-all cursor-pointer font-medium"
      >
        <ExternalLink className="w-4 h-4 text-accent-blue" />
        <span>Reveal in File Manager</span>
      </button>

      <button
        onClick={() => {
          onOpenInTerminal(node.path);
          onClose();
        }}
        className="w-full px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-slate-200 hover:bg-accent-purple/20 hover:text-white transition-all cursor-pointer font-medium"
      >
        <Terminal className="w-4 h-4 text-emerald-400" />
        <span>Open in Terminal</span>
      </button>

      <button
        onClick={() => {
          onCopyPath(node.path);
          onClose();
        }}
        className="w-full px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-slate-200 hover:bg-accent-purple/20 hover:text-white transition-all cursor-pointer font-medium"
      >
        <Copy className="w-4 h-4 text-accent-pink" />
        <span>Copy Path</span>
      </button>

      <div className="h-px bg-surface-border my-1" />

      {isProtected ? (
        <div className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center gap-2 text-[11px] font-semibold">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>Protected System Path</span>
        </div>
      ) : (
        <button
          onClick={() => {
            onDelete(node);
            onClose();
          }}
          className="w-full px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition-all cursor-pointer font-medium"
        >
          <Trash2 className="w-4 h-4" />
          <span>Move to Trash</span>
        </button>
      )}
    </div>
  );
});
