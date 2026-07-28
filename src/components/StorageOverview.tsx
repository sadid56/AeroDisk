import React, { useRef, useEffect } from "react";
import { ArrowLeft, ChevronRight, Folder, Layers } from "lucide-react";
import { DiskSpaceInfo, FileNode } from "../types";
import { formatBytes } from "../utils/formatters";
import { Button } from "./ui/Button";
import { Skeleton } from "./ui/Skeleton";

interface StorageOverviewProps {
  diskInfo: DiskSpaceInfo | null;
  activeNode: FileNode | null;
  flatNodes: FileNode[];
  breadcrumbIds: number[];
  totalItems: number;
  onNavigate: (nodeId: number) => void;
}

export const StorageOverview: React.FC<StorageOverviewProps> = React.memo(
  ({ diskInfo, activeNode, flatNodes, breadcrumbIds, totalItems, onNavigate }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
      }
    }, [breadcrumbIds]);

    const parentId = breadcrumbIds[breadcrumbIds.length - 2] ?? null;

    // Current directory size and percentage relative to parent
    const currentSize = activeNode?.size ?? 0;
    const parentNode = activeNode?.parentId !== null && activeNode?.parentId !== undefined ? flatNodes[activeNode.parentId] : null;
    const parentSize = parentNode?.size ?? (diskInfo ? diskInfo.total : 0);
    const sizePercentage = parentSize > 0 ? (currentSize / parentSize) * 100 : 0;

    return (
      <div className='bg-surface/50 border-b border-surface-border px-4 py-2.5 flex justify-between items-center gap-3 text-xs'>
        <div className='flex items-center gap-2'>
          {/* Back Button */}
          <Button
            variant='outline'
            size='icon'
            disabled={parentId === null && (activeNode === null || activeNode.parentId === null)}
            onClick={() => {
              if (parentId !== null) {
                onNavigate(parentId);
              } else if (activeNode && activeNode.parentId !== null) {
                onNavigate(activeNode.parentId);
              }
            }}
            title='Back to parent folder'
          >
            <ArrowLeft className='w-3.5 h-3.5' />
          </Button>

          {/* Breadcrumb with fixed width and horizontal scroll */}
          <div ref={scrollRef} className='flex items-center gap-1 overflow-x-auto scrollbar-none min-w-0 flex-1 max-w-[360px]'>
            {breadcrumbIds.length > 0 ? (
              breadcrumbIds.map((id, index) => {
                const node = flatNodes[id];
                if (!node) return null;
                const isLast = index === breadcrumbIds.length - 1;

                return (
                  <React.Fragment key={id}>
                    <Button
                      variant={isLast ? "secondary" : "ghost"}
                      size='sm'
                      onClick={() => onNavigate(id)}
                      leftIcon={index === 0 ? <Folder className='w-3 h-3' /> : undefined}
                      className={
                        isLast
                          ? "bg-accent-purple/15 text-accent-purple font-semibold border-accent-purple/30 hover:bg-accent-purple/25"
                          : "text-slate-400 hover:text-slate-200"
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
                <Skeleton width={64} height={20} rounded="sm" />
                <ChevronRight className='w-3 h-3 text-slate-700 shrink-0' />
                <Skeleton width={80} height={20} rounded="sm" delayMs={100} />
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
          <div className='flex items-center gap-3 shrink-0 min-w-[200px]'>
            {activeNode ? (
              <>
                <div className='flex-1'>
                  <div className='flex justify-between items-center text-[11px] mb-1'>
                    <span className='text-slate-400 font-medium'>Dir Size</span>
                    <span className='text-slate-200 font-mono font-semibold'>
                      {formatBytes(currentSize)}
                      <span className='text-slate-500 ml-1'>({sizePercentage.toFixed(1)}%)</span>
                    </span>
                  </div>
                  <div className='h-1.5 w-full bg-background rounded-full overflow-hidden border border-surface-border/50'>
                    <div
                      className='h-full bg-sky-400 rounded-full transition-all duration-500'
                      style={{ width: `${Math.min(100, Math.max(0, sizePercentage))}%` }}
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className='flex-1'>
                <div className='flex justify-between items-center text-[11px] mb-1'>
                  <span className='text-slate-400 font-medium'>Dir Size</span>
                  <Skeleton width={80} height={12} rounded="sm" />
                </div>
                <div className='h-1.5 w-full bg-background rounded-full overflow-hidden border border-surface-border/50'>
                  <Skeleton width="40%" height="100%" rounded="full" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  },
);
