import React from 'react';
import { Info } from "lucide-react";
import { FileNode } from '../../types';
import { formatBytes, getFileCategory } from '../../utils/formatters';
import { getFullPath } from '../../utils/pathUtils';

interface FocusCardProps {
  node: FileNode | null;
  flatNodes: FileNode[];
}

export const FocusCard: React.FC<FocusCardProps> = React.memo(({ node, flatNodes }) => {
  if (!node) {
    return (
      <div className='bg-surface/60 border-t border-surface-border p-4 flex items-center justify-center text-slate-500 text-xs gap-2'>
        <Info className='w-4 h-4 text-slate-600' />
        <span>Hover or select an item to inspect details</span>
      </div>
    );
  }

  const category = getFileCategory(node.name, node.isDirectory);
  const resolvedPath = getFullPath(node.id, flatNodes);

  return (
    <div className='bg-surface/80 border-t border-surface-border p-4 flex flex-wrap items-center justify-between gap-4 text-xs'>
      <div className='flex items-center gap-3 min-w-0 flex-1'>
        <div className='w-10 h-10 rounded-xl bg-background border border-surface-border flex items-center justify-center shrink-0 shadow-inner'>
          <category.Icon className={`w-5 h-5 ${category.color}`} />
        </div>
        <div className='min-w-0 flex-1'>
          <div className='flex items-center gap-2'>
            <h3 className='font-semibold text-slate-100 truncate text-sm' title={node.name}>
              {node.name || "/"}
            </h3>
          </div>
          <p className='text-[11px] text-slate-400 font-mono truncate mt-0.5' title={resolvedPath}>
            {resolvedPath}
          </p>
        </div>
      </div>

      <div className='flex items-center gap-2 shrink-0'>
        {node.isSymlink && (
          <span className='px-1.5 py-0.5 rounded bg-slate-900/10 dark:bg-slate-800/80 text-[10px] text-slate-400 border border-surface-border font-semibold select-none' title="Symbolic Link (Skipped to prevent double counting)">
            Symlink
          </span>
        )}
        <span className='text-xs font-bold text-slate-200'>{formatBytes(node.size)}</span>
      </div>
    </div>
  );
});
