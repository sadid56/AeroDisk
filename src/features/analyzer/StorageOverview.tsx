import React, { useRef, useEffect } from "react";
import { ArrowLeft, ChevronRight, Folder, Layers } from "lucide-react";
import { FileNode } from "../../types";
import { formatBytes } from "../../utils/formatters";
import { Button } from "../../components/ui/Button";
import { Skeleton } from "../../components/ui/Skeleton";

interface StorageOverviewProps {
  activeNode: FileNode | null;
  flatNodes: FileNode[];
  breadcrumbIds: number[];
  totalItems: number;
  onNavigate: (nodeId: number) => void;
  onBackToOrigin: () => void;
}

export const StorageOverview: React.FC<StorageOverviewProps> = React.memo(
  ({ activeNode, flatNodes, breadcrumbIds, totalItems, onNavigate, onBackToOrigin }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
      }
    }, [breadcrumbIds]);

    const parentId = breadcrumbIds[breadcrumbIds.length - 2] ?? null;

    // Current directory size
    const currentSize = activeNode?.size ?? 0;

    return (
      <div className='bg-surface/50 border-b border-surface-border px-4 py-2.5 flex justify-between items-center gap-3 text-xs'>
        <div className='flex items-center gap-2 min-w-0 flex-1'>
          {/* Back Button */}
          <Button
            variant='outline'
            size='icon'
            onClick={() => {
              if (parentId != null) {
                onNavigate(parentId);
              } else if (activeNode && activeNode.parentId != null) {
                onNavigate(activeNode.parentId);
              } else {
                onBackToOrigin();
              }
            }}
            title='Back'
          >
            <ArrowLeft className='w-3.5 h-3.5' />
          </Button>

          {/* Breadcrumb with fixed width and horizontal scroll */}
          <div ref={scrollRef} className='flex items-center gap-1 overflow-x-auto scrollbar-none min-w-0 flex-1 max-w-xs sm:max-w-md md:max-w-xl lg:max-w-2xl'>
            {breadcrumbIds.length > 0 ? (
              breadcrumbIds.map((id, index) => {
                const node = flatNodes[id];
                if (!node) return null;
                const isLast = index === breadcrumbIds.length - 1;

                return (
                  <React.Fragment key={id}>
                    <Button
                      variant="ghost"
                      size='sm'
                      onClick={() => onNavigate(id)}
                      leftIcon={index === 0 ? <Folder className='w-3 h-3' /> : undefined}
                      className={
                        isLast
                          ? "!bg-accent-purple/10 !text-accent-purple font-semibold border !border-accent-purple/20 hover:!bg-accent-purple/20 shadow-sm dark:shadow-none shrink-0 whitespace-nowrap"
                          : "text-slate-400 hover:text-slate-200 shrink-0 whitespace-nowrap"
                      }
                    >
                      <span>{node.name || "/"}</span>
                    </Button>
                    {!isLast && <ChevronRight className='w-3 h-3 text-slate-600 shrink-0' />}
                  </React.Fragment>
                );
              })
            ) : (
              /* Skeleton breadcrumb placeholder */
              <div className='flex items-center gap-1'>
                <Skeleton width={64} height={20} rounded='sm' />
                <ChevronRight className='w-3 h-3 text-slate-700 shrink-0' />
                <Skeleton width={80} height={20} rounded='sm' delayMs={100} />
              </div>
            )}
          </div>
        </div>

        <div className='flex items-center gap-4'>
          {/* Divider */}
          <div className='h-5 w-px bg-surface-border shrink-0' />

          {/* Scanned items count */}
          <div className='flex items-center gap-1.5 text-slate-300 font-medium shrink-0'>
            <Layers className='w-3.5 h-3.5 text-accent-teal' />
            <span className='text-slate-100 font-mono font-semibold'>{totalItems.toLocaleString()}</span>
          </div>

          {/* Divider */}
          <div className='h-5 w-px bg-surface-border shrink-0' />

          {/* Current Directory Size */}
          <div className='flex items-center gap-1.5 text-slate-300 font-medium shrink-0'>
            <span className='text-slate-400 font-medium'>Dir Size</span>
            <span className='text-slate-100 font-mono font-semibold'>
              {activeNode ? formatBytes(currentSize) : <Skeleton width={60} height={12} rounded='sm' />}
            </span>
          </div>
        </div>
      </div>
    );
  },
);
