import React, { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useNavigate } from "react-router-dom";
import { useScanner } from "./hooks/useScanner";
import { useDiskInfo } from "./hooks/useDiskInfo";
import { useSystemDrives } from "./hooks/useSystemDrives";
import { ContextMenu } from "./components/ContextMenu";
import { AlertModal } from "./components/ui/AlertModal";
import { CreateFolderModal } from "./components/CreateFolderModal";
import { SearchModal } from "./components/SearchModal";
import { ToastProvider, showToast } from "./providers/ToastProvider";
import { AppRoutes } from "./routes/AppRoutes";
import { useAutoUpdater } from "./hooks/useAutoUpdater";
import { UpdateModal } from "./components/UpdateModal";
import { applyThemeMode, applyFont, ThemeMode } from "./pages/SettingsPage";
import { FileNode } from "./types";
import { getFullPath } from "./utils/pathUtils";
import { useToolsData } from "./hooks/useToolsData";
import { useProtectedPath } from "./hooks/useProtectedPath";
import { LeftSidebar } from "./layout/LeftSidebar";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { Header } from "./layout/Header";

export const App: React.FC = () => {
  const updater = useAutoUpdater();
  const { updateAvailable } = updater;
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
    startScan,
    selectFolderDialog,
    navigateTo,
    removeNode,
    addFolderNode,
    resetToDashboard,
    activeNode,
  } = useScanner();

  const navigate = useNavigate();

  const rootPath = flatNodes[0]?.path;
  const { refreshDiskInfo } = useDiskInfo(rootPath);
  const { drives, folders, refetch: refetchDrives } = useSystemDrives();
  const { largeFiles, cleanupSuggestions, duplicateGroups, loading: toolsLoading, refetchTools } = useToolsData();

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; node: FileNode } | null>(null);
  const [pendingDeleteNode, setPendingDeleteNode] = useState<FileNode | null>(null);
  const { isProtected: trashIsProtected } = useProtectedPath(pendingDeleteNode ? getFullPath(pendingDeleteNode.id, flatNodes) : undefined);
  const [createFolderTarget, setCreateFolderTarget] = useState<FileNode | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  useEffect(() => {
    const savedMode = (localStorage.getItem("hyperdisk_theme_mode") as ThemeMode) || "dark";
    const savedFont = localStorage.getItem("hyperdisk_font");
    applyThemeMode(savedMode);
    if (savedFont) applyFont(savedFont);
  }, []);

  const handleScanPath = useCallback(async (path: string) => {
    try {
      navigate("/analyzer");
      let finalPath = path;
      if (path.startsWith("~")) {
        const home = await invoke<string>("get_home_folder");
        finalPath = path.replace("~", home);
      }
      await startScan(finalPath);

      // Save to recent scans
      try {
        const historyJson = localStorage.getItem("hyperdisk_scan_history") || "[]";
        const history: string[] = JSON.parse(historyJson);
        const filtered = history.filter((p) => p !== finalPath);
        filtered.unshift(finalPath);
        localStorage.setItem("hyperdisk_scan_history", JSON.stringify(filtered.slice(0, 10)));
      } catch (e) {
        console.error(e);
      }
    } catch (err: any) {
      showToast({ message: "Scan Error", description: err?.message || String(err), type: "error" });
    }
  }, [navigate, startScan]);

  const handleContextMenu = useCallback((e: React.MouseEvent, node: FileNode) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, node });
  }, []);

  const handleReveal = useCallback(async (path: string) => {
    try {
      await invoke("reveal_target_item", { targetPath: path });
    } catch (err: any) {
      showToast({ message: "Reveal Failed", description: err || "Could not open file manager", type: "error" });
    }
  }, []);

  const handleOpenInTerminal = useCallback(async (path: string) => {
    try {
      await invoke("open_in_terminal", { targetPath: path });
    } catch (err: any) {
      showToast({ message: "Terminal Failed", description: err || "Could not open terminal", type: "error" });
    }
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!pendingDeleteNode) return;
    setIsDeleting(true);

    try {
      await invoke("delete_target_item", { targetPath: getFullPath(pendingDeleteNode.id, flatNodes) });
      removeNode(pendingDeleteNode.id);

      if (currentId === pendingDeleteNode.id) {
        navigateTo(pendingDeleteNode.parentId !== null ? pendingDeleteNode.parentId : 0);
      }

      if (rootPath) {
        refreshDiskInfo(rootPath);
      }

      showToast({ message: "Moved to Trash", description: `Successfully deleted "${pendingDeleteNode.name}"`, type: "success" });
    } catch (err: any) {
      showToast({ message: "Deletion Failed", description: err || "Failed to move item to trash", type: "error" });
    } finally {
      setIsDeleting(false);
      setPendingDeleteNode(null);
    }
  }, [pendingDeleteNode, removeNode, currentId, navigateTo, rootPath, refreshDiskInfo, flatNodes]);

  const handleSelectFolder = useCallback(() => {
    navigate("/analyzer");
    selectFolderDialog();
  }, [navigate, selectFolderDialog]);

  const handleDashboard = useCallback(() => {
    resetToDashboard();
  }, [resetToDashboard]);

  const handleRescan = useCallback(() => {
    rootPath && startScan(rootPath);
  }, [rootPath, startScan]);

  const handleOpenSearchModal = useCallback(() => {
    setIsSearchOpen(true);
  }, []);

  const handleCloseSearchModal = useCallback(() => {
    setIsSearchOpen(false);
  }, []);

  const handleHoverNode = useCallback((node: FileNode | null) => {
    setHoveredNode(node);
  }, [setHoveredNode]);

  const handleSelectNode = useCallback((node: FileNode | null) => {
    setSelectedNode(node);
  }, [setSelectedNode]);

  const handleNavigateTo = useCallback((id: number) => {
    navigateTo(id);
  }, [navigateTo]);

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handlePendingDelete = useCallback((node: FileNode) => {
    setPendingDeleteNode(node);
  }, []);

  const handleCreateSubfolder = useCallback((node: FileNode) => {
    setCreateFolderTarget(node);
  }, []);

  const handleCopyPathClipboard = useCallback((path: string) => {
    navigator.clipboard.writeText(path);
    showToast({ message: "Copied", description: "Path copied to clipboard", type: "success" });
  }, []);

  const handleCancelDelete = useCallback(() => {
    setPendingDeleteNode(null);
  }, []);

  const handleCloseCreateFolder = useCallback(() => {
    setCreateFolderTarget(null);
  }, []);

  const handleFolderCreated = useCallback((newPath: string, folderName: string) => {
    if (createFolderTarget) {
      addFolderNode(createFolderTarget.id, newPath, folderName);
    }
  }, [createFolderTarget, addFolderNode]);

  const hasScanData = flatNodes.length > 0;

  useEffect(() => {
    const suppressContextMenu = (e: MouseEvent) => e.preventDefault();
    window.addEventListener('contextmenu', suppressContextMenu);
    return () => window.removeEventListener('contextmenu', suppressContextMenu);
  }, []);

  return (
    <div className='h-screen w-screen flex bg-background text-slate-100 overflow-hidden font-sans select-none'>
      {/* Left Sidebar navigation component */}
      <LeftSidebar onDashboard={handleDashboard} />

      {/* ─── MAIN COLUMN ──────────────────────────────────────────────────── */}
      <main className='flex-1 flex flex-col min-w-0 bg-background'>
        {/* Top Header Bar */}
        <Header
          onSelectFolder={handleSelectFolder}
          onDashboard={handleDashboard}
          onOpenSearchModal={handleOpenSearchModal}
          isScanning={isScanning}
          hasScanData={hasScanData}
          updateAvailable={updateAvailable}
          onRefresh={() => {
            refetchDrives();
            handleRescan();
          }}
        />

        {/* Dynamic App Content Route */}
        <AppRoutes
          isScanning={isScanning}
          hasScanData={hasScanData}
          scanCount={scanCount}
          scanStatusPath={scanStatusPath}
          flatNodes={flatNodes}
          currentId={currentId}
          breadcrumbIds={breadcrumbIds}
          hoveredNode={hoveredNode}
          selectedNode={selectedNode}
          activeNode={activeNode}
          searchQuery={searchQuery}
          onHoverNode={handleHoverNode}
          onSelectNode={handleSelectNode}
          onNavigate={handleNavigateTo}
          onContextMenu={handleContextMenu}
          onScanPath={handleScanPath}
          onSelectFolder={handleSelectFolder}
          updater={updater}
          drives={drives}
          folders={folders}
          largeFiles={largeFiles}
          cleanupSuggestions={cleanupSuggestions}
          duplicateGroups={duplicateGroups}
          toolsLoading={toolsLoading}
          onRefreshTools={refetchTools}
        />
      </main>

      {/* Modal overlays */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          node={contextMenu.node}
          flatNodes={flatNodes}
          onClose={handleCloseContextMenu}
          onNavigate={handleNavigateTo}
          onReveal={handleReveal}
          onDelete={handlePendingDelete}
          onCreateSubfolder={handleCreateSubfolder}
          onCopyPath={handleCopyPathClipboard}
          onOpenInTerminal={handleOpenInTerminal}
        />
      )}

      {pendingDeleteNode && (
        <AlertModal
          isOpen={Boolean(pendingDeleteNode)}
          title={trashIsProtected ? "Protected System Directory" : "Move Item to Trash?"}
          subtitle={pendingDeleteNode.name}
          icon={trashIsProtected ? <ShieldAlert className='w-5 h-5' /> : <AlertTriangle className='w-5 h-5' />}
          variant='danger'
          confirmLabel='Confirm Delete'
          cancelLabel='Cancel'
          isLoading={isDeleting}
          confirmDisabled={trashIsProtected}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
          message={
            trashIsProtected ? (
              <div className='p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs leading-relaxed space-y-1'>
                <p className='font-semibold flex items-center gap-1.5'>
                  <ShieldAlert className='w-4 h-4 text-amber-400' />
                  Deletion Disabled
                </p>
                <p className='opacity-90'>
                  This path is a critical system directory (
                  <span className='font-mono'>{getFullPath(pendingDeleteNode.id, flatNodes)}</span>). Deletion is disabled to protect system
                  integrity.
                </p>
              </div>
            ) : (
              <p className='text-xs text-slate-300 leading-relaxed'>
                Are you sure you want to move <span className='font-semibold text-slate-100'>{pendingDeleteNode.name}</span> to the system
                trash? This item can be restored from your trash bin.
              </p>
            )
          }
        />
      )}

      <CreateFolderModal
        isOpen={Boolean(createFolderTarget)}
        parentFolder={createFolderTarget}
        onClose={handleCloseCreateFolder}
        onFolderCreated={handleFolderCreated}
      />

      <SearchModal
        isOpen={isSearchOpen}
        onClose={handleCloseSearchModal}
        flatNodes={flatNodes}
        onNavigate={handleNavigateTo}
        onSelectNode={handleSelectNode}
        onScanPath={handleScanPath}
      />

      <UpdateModal
        isOpen={updater.showModal}
        version={updater.updateInfo?.version || ""}
        body={updater.updateInfo?.body}
        installing={updater.installing}
        progressPercent={updater.progressPercent}
        onConfirm={updater.startUpdate}
        onSkip={updater.skipUpdate}
      />

      <ToastProvider />
    </div>
  );
};
