import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { HardDrive, Loader2 } from 'lucide-react';
import { useScanner } from './hooks/useScanner';
import { useDiskInfo } from './hooks/useDiskInfo';
import { Header } from './components/Header';
import { StorageOverview } from './components/StorageOverview';
import { BreadcrumbNav } from './components/BreadcrumbNav';
import { SunburstChart } from './components/SunburstChart';
import { FileList } from './components/FileList';
import { FocusCard } from './components/FocusCard';
import { ContextMenu } from './components/ContextMenu';
import { DeleteModal } from './components/DeleteModal';
import { ToastContainer } from './components/Toast';
import { WelcomeDashboard } from './components/WelcomeDashboard';
import { FileNode, ToastMessage } from './types';

export const App: React.FC = () => {
  const {
    flatNodes,
    currentId,
    breadcrumbIds,
    isScanning,
    scanCount,
    scanStatusPath,
    hoveredNode,
    setHoveredNode,
    selectedNode,
    setSelectedNode,
    searchQuery,
    setSearchQuery,
    startScan,
    selectFolderDialog,
    scanHomeFolder,
    navigateTo,
    removeNode,
    activeNode,
  } = useScanner();

  const rootPath = flatNodes[0]?.path;
  const { diskInfo, refreshDiskInfo } = useDiskInfo(rootPath);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; node: FileNode } | null>(null);
  const [pendingDeleteNode, setPendingDeleteNode] = useState<FileNode | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const addToast = (title: string, message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Helper to resolve paths like ~/Documents
  const handleScanPath = async (path: string) => {
    try {
      if (path.startsWith('~')) {
        const home = await invoke<string>('get_home_folder');
        const resolved = path.replace('~', home);
        await startScan(resolved);
      } else {
        await startScan(path);
      }
    } catch (err: any) {
      addToast('Scan Error', err?.message || String(err), 'error');
    }
  };

  // Context menu handler
  const handleContextMenu = (e: React.MouseEvent, node: FileNode) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, node });
  };

  // Reveal item in native file manager
  const handleReveal = async (path: string) => {
    try {
      await invoke('reveal_target_item', { targetPath: path });
    } catch (err: any) {
      addToast('Reveal Failed', err || 'Could not open file manager', 'error');
    }
  };

  // Move item to native trash
  const handleConfirmDelete = async () => {
    if (!pendingDeleteNode) return;
    setIsDeleting(true);

    try {
      await invoke('delete_target_item', { targetPath: pendingDeleteNode.path });
      removeNode(pendingDeleteNode.id);

      if (currentId === pendingDeleteNode.id) {
        navigateTo(pendingDeleteNode.parentId !== null ? pendingDeleteNode.parentId : 0);
      }

      if (rootPath) {
        refreshDiskInfo(rootPath);
      }

      addToast('Moved to Trash', `Successfully deleted "${pendingDeleteNode.name}"`);
    } catch (err: any) {
      addToast('Deletion Failed', err || 'Failed to move item to trash', 'error');
    } finally {
      setIsDeleting(false);
      setPendingDeleteNode(null);
    }
  };

  const hasScanData = flatNodes.length > 0;

  return (
    <div className="h-screen w-screen flex flex-col bg-background bg-glow overflow-hidden font-sans text-slate-100">
      <Header
        onSelectFolder={selectFolderDialog}
        onHomeFolder={scanHomeFolder}
        onRescan={() => rootPath && startScan(rootPath)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isScanning={isScanning}
        hasScanData={hasScanData}
      />

      {isScanning ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-accent-purple via-accent-pink to-accent-blue flex items-center justify-center shadow-xl shadow-accent-purple/30 animate-pulse">
              <HardDrive className="w-8 h-8 text-white" />
            </div>
            <Loader2 className="w-6 h-6 text-accent-purple animate-spin absolute -bottom-2 -right-2 bg-surface p-1 rounded-full border border-surface-border" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Indexing Directory</h2>
            <p className="text-xs text-slate-400 font-mono mt-1 max-w-md truncate">
              {scanCount.toLocaleString()} items processed
            </p>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5 max-w-lg truncate">
              {scanStatusPath}
            </p>
          </div>
        </div>
      ) : hasScanData ? (
        <div className="flex-1 flex flex-col min-h-0">
          <StorageOverview
            diskInfo={diskInfo}
            scannedPath={activeNode?.path || rootPath}
            totalItems={flatNodes.length}
          />

          <BreadcrumbNav
            flatNodes={flatNodes}
            breadcrumbIds={breadcrumbIds}
            onNavigate={navigateTo}
          />

          <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0 border-b border-surface-border">
            {/* Sunburst Canvas Visualization */}
            <div className="md:col-span-6 lg:col-span-7 bg-surface/20 border-r border-surface-border flex flex-col items-center justify-center min-h-[300px] relative">
              <SunburstChart
                flatNodes={flatNodes}
                currentId={currentId}
                hoveredNode={hoveredNode}
                onHoverNode={setHoveredNode}
                onNavigate={navigateTo}
              />
            </div>

            {/* File List Table View */}
            <div className="md:col-span-6 lg:col-span-5 flex flex-col bg-surface/30 min-h-[300px]">
              <div className="px-4 py-2 bg-surface/60 border-b border-surface-border text-[11px] font-bold text-slate-400 uppercase tracking-wider flex justify-between">
                <span>Contents</span>
                <span>Size</span>
              </div>
              <FileList
                activeNode={activeNode}
                flatNodes={flatNodes}
                searchQuery={searchQuery}
                hoveredNode={hoveredNode}
                selectedNode={selectedNode}
                onHoverNode={setHoveredNode}
                onSelectNode={setSelectedNode}
                onNavigate={navigateTo}
                onContextMenu={handleContextMenu}
              />
            </div>
          </div>

          <FocusCard
            node={hoveredNode || selectedNode || activeNode}
            onCopyPath={() => addToast('Copied', 'Path copied to clipboard')}
          />
        </div>
      ) : (
        <WelcomeDashboard
          onSelectFolder={selectFolderDialog}
          onScanPath={handleScanPath}
          isScanning={isScanning}
        />
      )}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          node={contextMenu.node}
          onClose={() => setContextMenu(null)}
          onNavigate={navigateTo}
          onReveal={handleReveal}
          onDelete={(node) => setPendingDeleteNode(node)}
          onCopyPath={(path) => {
            navigator.clipboard.writeText(path);
            addToast('Copied', 'Path copied to clipboard');
          }}
        />
      )}

      <DeleteModal
        node={pendingDeleteNode}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDeleteNode(null)}
        isDeleting={isDeleting}
      />

      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};
