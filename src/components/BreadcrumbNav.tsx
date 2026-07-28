import React from 'react';
import { ChevronRight, Folder, ArrowLeft } from 'lucide-react';
import { FileNode } from '../types';
import { Button } from './ui/Button';

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
        <Button
          variant="outline"
          size="icon"
          onClick={() => onNavigate(parentId)}
          title="Back to parent folder"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-accent-purple" />
        </Button>
      )}

      {breadcrumbIds.map((id, index) => {
        const node = flatNodes[id];
        if (!node) return null;
        const isLast = index === breadcrumbIds.length - 1;

        return (
          <React.Fragment key={id}>
            <Button
              variant={isLast ? "secondary" : "ghost"}
              size="sm"
              onClick={() => onNavigate(id)}
              leftIcon={index === 0 ? <Folder className="w-3.5 h-3.5" /> : undefined}
              className={isLast ? "bg-accent-purple/15 text-accent-purple font-semibold border-accent-purple/30 hover:bg-accent-purple/25" : "text-slate-400 hover:text-slate-200"}
            >
              <span>{node.name || '/'}</span>
            </Button>

            {!isLast && <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />}
          </React.Fragment>
        );
      })}
    </div>
  );
});
