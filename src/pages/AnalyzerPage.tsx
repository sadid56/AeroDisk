import React from 'react';
import { Loader2 } from 'lucide-react';
import { StorageOverview } from '../components/StorageOverview';
import { BreadcrumbNav } from '../components/BreadcrumbNav';
import { SunburstChart } from '../components/SunburstChart';
import { FileList } from '../components/FileList';
import { FocusCard } from '../components/FocusCard';
import { FileNode, DiskSpaceInfo } from '../types';

interface AnalyzerPageProps {
  flatNodes: FileNode[];
  currentId: number | null;
  breadcrumbIds: number[];
  diskInfo: DiskSpaceInfo | null;
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
  onCopyPath: () => void;
}

export const AnalyzerPage: React.FC<AnalyzerPageProps> = React.memo(({
  flatNodes,
  currentId,
  breadcrumbIds,
  diskInfo,
  hoveredNode,
  selectedNode,
  activeNode,
  searchQuery,
  isScanning,
  scanCount,
  scanStatusPath,
  onHoverNode,
  onSelectNode,
  onNavigate,
  onContextMenu,
  onCopyPath,
}) => {
  const rootPath = flatNodes[0]?.path;

  return (
    <div className="flex-1 flex flex-col min-h-0 animate-in fade-in duration-150">
      <StorageOverview
        diskInfo={diskInfo}
        scannedPath={activeNode?.path || rootPath}
        totalItems={flatNodes.length}
      />

      {isScanning && (
        <div className="px-6 py-2 border-b border-accent-purple/20 bg-accent-purple/10 flex items-center gap-3 text-xs">
          <Loader2 className="w-4 h-4 text-accent-purple animate-spin shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold text-slate-100">
                Indexing {scanCount.toLocaleString()} items
              </span>
              <span className="text-[11px] text-slate-400 truncate max-w-[55%]" title={scanStatusPath}>
                {scanStatusPath}
              </span>
            </div>
            <div className="mt-1 h-1 w-full rounded-full bg-background overflow-hidden">
              <div className="h-full w-full bg-gradient-to-r from-accent-purple via-accent-pink to-accent-blue animate-pulse" />
            </div>
          </div>
        </div>
      )}

      <BreadcrumbNav
        flatNodes={flatNodes}
        breadcrumbIds={breadcrumbIds}
        onNavigate={onNavigate}
      />

      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0 border-b border-surface-border">
        <div className="md:col-span-6 lg:col-span-7 bg-surface/20 border-r border-surface-border flex flex-col items-center justify-center min-h-[300px] relative">
          <SunburstChart
            flatNodes={flatNodes}
            currentId={currentId}
            hoveredNode={hoveredNode}
            isScanning={isScanning}
            onHoverNode={onHoverNode}
            onNavigate={onNavigate}
          />
        </div>

        <div className="md:col-span-6 lg:col-span-5 flex flex-col bg-surface/30 min-h-[300px]">
          <div className="px-4 py-2 bg-surface/60 border-b border-surface-border text-[11px] font-bold text-slate-400 uppercase tracking-wider flex justify-between">
            <span>Contents</span>
            <span>Size</span>
          </div>
          <FileList
            activeNode={activeNode}
            flatNodes={flatNodes}
            searchQuery={searchQuery}
            isScanning={isScanning}
            hoveredNode={hoveredNode}
            selectedNode={selectedNode}
            onHoverNode={onHoverNode}
            onSelectNode={onSelectNode}
            onNavigate={onNavigate}
            onContextMenu={onContextMenu}
          />
        </div>
      </div>

      <FocusCard
        node={hoveredNode || selectedNode || activeNode}
        onCopyPath={onCopyPath}
      />
    </div>
  );
});
