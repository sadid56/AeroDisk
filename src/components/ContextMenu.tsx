import React, { useEffect, useRef } from 'react';
import { FolderOpen, ExternalLink, Trash2, Copy } from 'lucide-react';
import { FileNode } from '../types';

interface ContextMenuProps {
  x: number;
  y: number;
  node: FileNode | null;
  onClose: () => void;
  onNavigate: (nodeId: number) => void;
  onReveal: (path: string) => void;
  onDelete: (node: FileNode) => void;
  onCopyPath: (path: string) => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  node,
  onClose,
  onNavigate,
  onReveal,
  onDelete,
  onCopyPath,
}) => {
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  if (!node) return null;

  // Adjust menu coordinates so it doesn't overflow screen boundaries
  const adjustedX = Math.min(x, window.innerWidth - 190);
  const adjustedY = Math.min(y, window.innerHeight - 170);

  return (
    <div
      ref={menuRef}
      style={{ left: `${adjustedX}px`, top: `${adjustedY}px` }}
      className="fixed z-50 w-48 bg-surface/95 backdrop-blur-xl border border-surface-border rounded-xl shadow-2xl p-1.5 text-xs text-slate-200 select-none animate-in fade-in zoom-in-95 duration-100"
    >
      {node.isDirectory && (
        <button
          onClick={() => {
            onNavigate(node.id);
            onClose();
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-accent-purple/20 hover:text-white transition-all font-medium text-left"
        >
          <FolderOpen className="w-4 h-4 text-accent-purple" />
          <span>Open Directory</span>
        </button>
      )}

      <button
        onClick={() => {
          onReveal(node.path);
          onClose();
        }}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-surface-hover hover:text-white transition-all font-medium text-left"
      >
        <ExternalLink className="w-4 h-4 text-accent-blue" />
        <span>Reveal in File Manager</span>
      </button>

      <button
        onClick={() => {
          onCopyPath(node.path);
          onClose();
        }}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-surface-hover hover:text-white transition-all font-medium text-left"
      >
        <Copy className="w-4 h-4 text-accent-teal" />
        <span>Copy Path</span>
      </button>

      <div className="h-px bg-surface-border my-1" />

      <button
        onClick={() => {
          onDelete(node);
          onClose();
        }}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-all font-medium text-left"
      >
        <Trash2 className="w-4 h-4 text-rose-400" />
        <span>Move to Trash</span>
      </button>
    </div>
  );
};
