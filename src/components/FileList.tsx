import React from 'react';
import { MoreVertical } from 'lucide-react';
import { FileNode } from '../types';
import { formatBytes, getFileCategory } from '../utils/formatters';

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

export const FileList: React.FC<FileListProps> = ({
  activeNode,
  flatNodes,
  searchQuery,
  hoveredNode,
  selectedNode,
  onHoverNode,
  onSelectNode,
  onNavigate,
  onContextMenu,
}) => {
  if (!activeNode) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-slate-500 text-xs font-medium">
        No folder selected.
      </div>
    );
  }

  // Get child nodes safely
  let children: FileNode[] = [];
  if (searchQuery.trim().length > 0) {
    const q = searchQuery.toLowerCase();
    children = flatNodes.filter((n) => n && n.name && n.name.toLowerCase().includes(q));
  } else if (activeNode && Array.isArray(activeNode.childIds)) {
    children = activeNode.childIds
      .map((id) => flatNodes[id])
      .filter((n): n is FileNode => Boolean(n));
  }

  if (children.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-slate-500 text-xs font-medium">
        This folder contains no items.
      </div>
    );
  }

  const maxParentSize = activeNode.size > 0 ? activeNode.size : 1;

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-surface-border">
      <div className="divide-y divide-surface-border/50">
        {children.map((child) => {
          const category = getFileCategory(child.name, child.isDirectory);
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
              <span className="text-base shrink-0">{category.icon}</span>

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
};
