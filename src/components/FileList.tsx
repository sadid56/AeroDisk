import React, { useMemo } from 'react';
import { MoreVertical, Search } from 'lucide-react';
import { FileNode } from '../types';
import { formatBytes, getFileCategory } from '../utils/formatters';

interface FileListProps {
  activeNode: FileNode | null;
  flatNodes: FileNode[];
  searchQuery: string;
  isScanning: boolean;
  hoveredNode: FileNode | null;
  selectedNode: FileNode | null;
  onHoverNode: (node: FileNode | null) => void;
  onSelectNode: (node: FileNode) => void;
  onNavigate: (nodeId: number) => void;
  onContextMenu: (e: React.MouseEvent, node: FileNode) => void;
}

const MAX_SEARCH_RESULTS = 100;

export const FileList: React.FC<FileListProps> = React.memo(({
  activeNode,
  flatNodes,
  searchQuery,
  isScanning,
  hoveredNode,
  selectedNode,
  onHoverNode,
  onSelectNode,
  onNavigate,
  onContextMenu,
}) => {
  const isSearching = searchQuery.trim().length > 0;

  // Optimized & Capped Search filtering to prevent UI hanging & memory spikes
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
      const children = activeNode.childIds
        .map((id) => flatNodes[id])
        .filter((n): n is FileNode => Boolean(n));
      return { displayChildren: children, totalMatches: children.length };
    }

    return { displayChildren: [], totalMatches: 0 };
  }, [activeNode, flatNodes, searchQuery, isSearching]);

  if (!activeNode) {
    if (isScanning) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-500 text-xs font-medium gap-2">
          <div className="w-8 h-8 rounded-full border-2 border-accent-purple border-t-transparent animate-spin" />
          <div>Indexing files in real time...</div>
          <div className="text-[11px] text-slate-600">The first folder view will appear as soon as the root is ready.</div>
        </div>
      );
    }

    return (
      <div className="flex-1 flex items-center justify-center p-6 text-slate-500 text-xs font-medium">
        No folder selected.
      </div>
    );
  }

  if (displayChildren.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-slate-500 text-xs font-medium">
        {isSearching ? `No matches found for "${searchQuery}"` : 'This folder contains no items.'}
      </div>
    );
  }

  const maxParentSize = activeNode.size > 0 ? activeNode.size : 1;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {isSearching && (
        <div className="px-4 py-1.5 bg-accent-purple/10 border-b border-accent-purple/20 text-[11px] text-accent-purple font-medium flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Search className="w-3 h-3" />
            Showing top {displayChildren.length} search matches
          </span>
          <span className="text-[10px] text-slate-400">Limited for speed</span>
        </div>
      )}

      <div className="flex-1 overflow-y-scroll overflow-x-hidden scrollbar-stable divide-y divide-surface-border/50">
        {displayChildren.map((child) => {
          const category = getFileCategory(child.name, child.isDirectory);
          const Icon = category.Icon;
          const percentage = (child.size / maxParentSize) * 100;
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
              className={`group flex items-center gap-3 px-4 py-2.5 transition-all cursor-pointer text-xs border-l-2 ${
                isHovered || isSelected
                  ? 'bg-surface-hover/90 border-accent-purple'
                  : 'bg-transparent border-transparent hover:bg-surface/60'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${category.color}`} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-medium text-slate-200 truncate group-hover:text-white" title={child.name}>
                    {child.name}
                  </span>
                  <span className="font-mono text-[11px] text-slate-400 font-semibold shrink-0">
                    {formatBytes(child.size)}
                  </span>
                </div>

                <div className="h-1.5 w-full bg-background rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-accent-purple to-accent-blue rounded-full transition-all duration-300 group-hover:brightness-125"
                    style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
                  />
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onContextMenu(e, child);
                }}
                className="p-1 rounded-md text-slate-500 hover:text-slate-200 hover:bg-surface-border/50 opacity-0 group-hover:opacity-100 transition-opacity"
                title="More actions"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
});
