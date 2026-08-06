import React from "react";
import { StorageOverview } from "../components/StorageOverview";
import { SunburstChart } from "../components/SunburstChart";
import { FileList } from "../components/FileList";
import { FocusCard } from "../components/FocusCard";
import { FileNode } from "../types";

interface AnalyzerPageProps {
  flatNodes: FileNode[];
  currentId: number | null;
  breadcrumbIds: number[];
  hoveredNode: FileNode | null;
  selectedNode: FileNode | null;
  activeNode: FileNode | null;
  searchQuery: string;
  isScanning: boolean;
  scanCount: number;
  scanStatusPath: string;
  onHoverNode: (node: FileNode | null) => void;
  onSelectNode: (node: FileNode | null) => void;
  onNavigate: (id: number) => void;
  onContextMenu: (e: React.MouseEvent, node: FileNode) => void;
}

export const AnalyzerPage: React.FC<AnalyzerPageProps> = React.memo(
  ({
    flatNodes,
    currentId,
    breadcrumbIds,
    hoveredNode,
    selectedNode,
    activeNode,
    searchQuery,
    isScanning,
    scanCount: _scanCount,
    scanStatusPath: _scanStatusPath,
    onHoverNode,
    onSelectNode,
    onNavigate,
    onContextMenu,
  }) => {
    return (
      <div className='flex-1 flex flex-col min-h-0 animate-in fade-in duration-150'>
        <StorageOverview
          activeNode={activeNode}
          flatNodes={flatNodes}
          breadcrumbIds={breadcrumbIds}
          totalItems={flatNodes.length}
          onNavigate={onNavigate}
        />

        <div className='flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0 border-b border-surface-border'>
          <div className='md:col-span-6 lg:col-span-7 bg-surface/20 border-r border-surface-border flex flex-col items-center justify-center min-h-[300px] relative'>
            <SunburstChart
              flatNodes={flatNodes}
              currentId={currentId}
              hoveredNode={hoveredNode}
              isScanning={isScanning}
              onHoverNode={onHoverNode}
              onNavigate={onNavigate}
            />
          </div>

          <div className='md:col-span-6 lg:col-span-5 flex flex-col bg-surface/30 min-h-[300px]'>
            <div className='px-4 py-2 bg-surface/60 border-b border-surface-border text-[11px] font-bold text-slate-400 uppercase tracking-wider flex justify-between'>
              <span>Contents</span>
              <span>Size</span>
            </div>
            <FileList
              activeNode={activeNode}
              flatNodes={flatNodes}
              searchQuery={searchQuery}
              hoveredNode={hoveredNode}
              selectedNode={selectedNode}
              onHoverNode={onHoverNode}
              onSelectNode={onSelectNode}
              onNavigate={onNavigate}
              onContextMenu={onContextMenu}
            />
          </div>
        </div>

        <FocusCard node={hoveredNode || selectedNode || activeNode} flatNodes={flatNodes} />
      </div>
    );
  },
);
