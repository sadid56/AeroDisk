import React from 'react';
import { ChevronRight, Folder } from 'lucide-react';
import { FileNode } from '../types';

interface BreadcrumbNavProps {
  flatNodes: FileNode[];
  breadcrumbIds: number[];
  onNavigate: (nodeId: number) => void;
}

export const BreadcrumbNav: React.FC<BreadcrumbNavProps> = ({
  flatNodes,
  breadcrumbIds,
  onNavigate,
}) => {
  if (breadcrumbIds.length === 0) return null;

  return (
    <div className="flex items-center gap-1 overflow-x-auto py-2 px-6 bg-surface/30 border-b border-surface-border scrollbar-none text-xs">
      {breadcrumbIds.map((id, index) => {
        const node = flatNodes[id];
        if (!node) return null;
        const isLast = index === breadcrumbIds.length - 1;

        return (
          <React.Fragment key={id}>
            <button
              onClick={() => onNavigate(id)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-all font-medium whitespace-nowrap ${
                isLast
                  ? 'bg-accent-purple/15 text-accent-purple font-semibold border border-accent-purple/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-surface-hover'
              }`}
            >
              {index === 0 && <Folder className="w-3.5 h-3.5" />}
              <span>{node.name || '/'}</span>
            </button>

            {!isLast && <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />}
          </React.Fragment>
        );
      })}
    </div>
  );
};
