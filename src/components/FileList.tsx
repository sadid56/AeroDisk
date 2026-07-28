import React, { useMemo } from 'react';
import { MoreVertical, Search } from 'lucide-react';
import { FileNode } from '../types';
import { formatBytes, formatDate, getFileCategory } from "../utils/formatters";
import { Skeleton } from "./ui/Skeleton";

interface FileListProps {
  activeNode: FileNode | null;
  flatNodes: FileNode[];
  searchQuery: string;
  hoveredNode: FileNode | null;
  selectedNode: FileNode | null;
  onHoverNode: (node: FileNode | null) => void;
  onSelectNode: (node: FileNode) => void;
  onNavigate: (nodeId: number) => void;
  onContextMenu: (e: React.MouseEvent, node: FileNode) => void;
}

const MAX_SEARCH_RESULTS = 100;


export const FileList: React.FC<FileListProps> = React.memo(
  ({ activeNode, flatNodes, searchQuery, hoveredNode, selectedNode, onHoverNode, onSelectNode, onNavigate, onContextMenu }) => {
    const isSearching = searchQuery.trim().length > 0;

    const { displayChildren } = useMemo(() => {
      if (!activeNode) return { displayChildren: [], totalMatches: 0 };

      if (isSearching) {
        const q = searchQuery.toLowerCase().trim();
        const matches: FileNode[] = [];

        for (let i = 0; i < flatNodes.length; i++) {
          const node = flatNodes[i];
          if (node && node.name && node.name.toLowerCase().includes(q)) {
            matches.push(node);
            if (matches.length >= MAX_SEARCH_RESULTS) {
              break;
            }
          }
        }

        return { displayChildren: matches, totalMatches: matches.length };
      }

      if (Array.isArray(activeNode.childIds)) {
        const children = activeNode.childIds.map((id) => flatNodes[id]).filter((n): n is FileNode => Boolean(n));
        return { displayChildren: children, totalMatches: children.length };
      }

      return { displayChildren: [], totalMatches: 0 };
    }, [activeNode, flatNodes, searchQuery, isSearching]);

    if (!activeNode) {
      return (
        <div className='flex-1 flex flex-col min-h-0'>
          <div className='flex-1 overflow-hidden divide-y divide-surface-border/50'>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className='flex items-center gap-3 px-4 py-2.5 border-l-2 border-transparent'>
                <Skeleton width={16} height={16} rounded='sm' className='shrink-0' delayMs={i * 50} />
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center justify-between gap-2'>
                    <Skeleton height={12} rounded='sm' style={{ width: `${40 + ((i * 17) % 45)}%` }} delayMs={i * 50} />
                    <Skeleton width={48} height={12} rounded='sm' className='shrink-0' delayMs={i * 50} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (displayChildren.length === 0) {
      return (
        <div className='flex-1 flex items-center justify-center p-6 text-slate-500 text-xs font-medium'>
          {isSearching ? `No matches found for "${searchQuery}"` : "This folder contains no items."}
        </div>
      );
    }

    return (
      <div className='flex-1 flex flex-col min-h-0'>
        {isSearching && (
          <div className='px-4 py-1.5 bg-accent-purple/10 border-b border-accent-purple/20 text-[11px] text-accent-purple font-medium flex items-center justify-between'>
            <span className='flex items-center gap-1.5'>
              <Search className='w-3 h-3' />
              Showing top {displayChildren.length} search matches
            </span>
            <span className='text-[10px] text-slate-400'>Limited for speed</span>
          </div>
        )}

        <div className='flex-1 overflow-y-scroll overflow-x-hidden scrollbar-stable divide-y divide-surface-border/50'>
          {displayChildren.map((child) => {
            const category = getFileCategory(child.name, child.isDirectory);
            const Icon = category.Icon;
            const isHovered = hoveredNode?.id === child.id;
            const isSelected = selectedNode?.id === child.id;
            return (
              <div
                key={child.id}
                onClick={() => onSelectNode(child)}
                onDoubleClick={() => {
                  if (child.isDirectory) onNavigate(child.id);
                }}
                onMouseEnter={() => onHoverNode(child)}
                onMouseLeave={() => onHoverNode(null)}
                onContextMenu={(e) => onContextMenu(e, child)}
                className={`group flex items-center gap-3 px-4 py-2.5 transition-all cursor-pointer text-xs border-l-2 border-b ${
                  isHovered || isSelected
                    ? "bg-surface-hover/90 border-sky-500 border-b-transparent"
                    : "bg-transparent border-transparent border-b-surface-border/50 hover:bg-surface/60"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${category.color}`} />

                <div className='flex-1 min-w-0'>
                  <div className='flex items-center justify-between gap-2'>
                    <span className='font-medium text-slate-200 truncate group-hover:text-white' title={child.name}>
                      {child.name}
                    </span>
                  </div>
                  {child.createdAt && <p className='text-[10px] text-slate-500 mt-0.5'>{formatDate(child.createdAt)}</p>}
                </div>
                <span className='font-mono text-[11px] text-slate-400 font-semibold shrink-0'>{formatBytes(child.size)}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onContextMenu(e, child);
                  }}
                  className='p-1 rounded-md text-slate-500 hover:text-slate-200 hover:bg-surface-border/50 opacity-0 group-hover:opacity-100 transition-opacity'
                  title='More actions'
                >
                  <MoreVertical className='w-4 h-4' />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  },
);

