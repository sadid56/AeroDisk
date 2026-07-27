import React from 'react';
import { Info, Copy, Check } from 'lucide-react';
import { FileNode } from '../types';
import { formatBytes, getFileCategory } from '../utils/formatters';

interface FocusCardProps {
  node: FileNode | null;
  onCopyPath?: (path: string) => void;
}

export const FocusCard: React.FC<FocusCardProps> = ({ node, onCopyPath }) => {
  const [copied, setCopied] = React.useState(false);

  if (!node) {
    return (
      <div className="bg-surface/60 border-t border-surface-border p-4 flex items-center justify-center text-slate-500 text-xs gap-2">
        <Info className="w-4 h-4 text-slate-600" />
        <span>Hover or select an item to inspect details</span>
      </div>
    );
  }

  const category = getFileCategory(node.name, node.isDirectory);

  const handleCopy = () => {
    navigator.clipboard.writeText(node.path);
    setCopied(true);
    if (onCopyPath) onCopyPath(node.path);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-surface/80 border-t border-surface-border p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-10 h-10 rounded-xl bg-background border border-surface-border flex items-center justify-center shrink-0 shadow-inner">
          <category.Icon className={`w-5 h-5 ${category.color}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-100 truncate text-sm" title={node.name}>
              {node.name || '/'}
            </h3>
            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold bg-surface border border-surface-border ${category.color}`}>
              {category.label}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono truncate mt-0.5" title={node.path}>
            {node.path}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <div className="text-right">
          <span className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total Size</span>
          <span className="font-mono text-sm font-bold text-accent-purple">{formatBytes(node.size)}</span>
        </div>

        <button
          onClick={handleCopy}
          className="p-2 rounded-lg bg-surface border border-surface-border text-slate-400 hover:text-slate-200 hover:bg-surface-hover hover:border-slate-700 transition-all flex items-center gap-1.5 text-xs font-medium"
          title="Copy full path"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Path</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
