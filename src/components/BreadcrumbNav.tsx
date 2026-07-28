import React from 'react';
import { ChevronRight, Folder, ArrowLeft } from 'lucide-react';
import { FileNode } from '../types';

interface BreadcrumbNavProps {
  flatNodes: FileNode[];
  breadcrumbIds: number[];
  onNavigate: (nodeId: number) => void;
}

export const BreadcrumbNav: React.FC<BreadcrumbNavProps> = React.memo(({
  flatNodes,
  breadcrumbIds,
  onNavigate,
}) => {
  if (breadcrumbIds.length === 0) return null;

  const canGoBack = breadcrumbIds.length > 1;
  const parentId = canGoBack ? breadcrumbIds[breadcrumbIds.length - 2] : null;

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto py-2 px-6 bg-surface/30 border-b border-surface-border scrollbar-none text-xs">
      {canGoBack && parentId !== null && (
        <button
          onClick={() => onNavigate(parentId)}
          title="Back to parent folder"
          className="p-1.5 rounded-lg bg-surface border border-surface-border text-accent-purple hover:bg-surface-hover transition-all cursor-pointer mr-1 shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
        </button>
      )}

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
});
