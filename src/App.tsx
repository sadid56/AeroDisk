import React, { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useNavigate } from "react-router-dom";
import { useScanner } from "./hooks/useScanner";
import { useDiskInfo } from "./hooks/useDiskInfo";
import { Header } from "./components/Header";
import { ContextMenu } from "./components/ContextMenu";
import { DeleteModal } from "./components/DeleteModal";
import { CreateFolderModal } from "./components/CreateFolderModal";
import { SearchModal } from "./components/SearchModal";
import { ToastProvider, showToast } from "./providers/ToastProvider";
import { AppRoutes } from "./routes/AppRoutes";
import { useAutoUpdater } from "./hooks/useAutoUpdater";
import { UpdateModal } from "./components/UpdateModal";
import { applyThemeMode, applyFont, ThemeMode } from "./pages/SettingsPage";
import { FileNode } from "./types";

export const App: React.FC = () => {
  const updater = useAutoUpdater();
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
  const { diskInfo, refreshDiskInfo } = useDiskInfo(rootPath);

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; node: FileNode } | null>(null);
  const [pendingDeleteNode, setPendingDeleteNode] = useState<FileNode | null>(null);
  const [createFolderTarget, setCreateFolderTarget] = useState<FileNode | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  useEffect(() => {
    const savedMode = (localStorage.getItem("aerodisk_theme_mode") as ThemeMode) || "dark";
    const savedFont = localStorage.getItem("aerodisk_font");
    applyThemeMode(savedMode);
    if (savedFont) applyFont(savedFont);
  }, []);

  const handleScanPath = useCallback(async (path: string) => {
    try {
      navigate("/");
      if (path.startsWith("~")) {
        const home = await invoke<string>("get_home_folder");
        const resolved = path.replace("~", home);
        await startScan(resolved);
      } else {
        await startScan(path);
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
      await invoke("delete_target_item", { targetPath: pendingDeleteNode.path });
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
  }, [pendingDeleteNode, removeNode, currentId, navigateTo, rootPath, refreshDiskInfo]);

  const handleSelectFolder = useCallback(() => {
    navigate("/");
    selectFolderDialog();
  }, [navigate, selectFolderDialog]);

  const handleDashboard = useCallback(() => {
    resetToDashboard();
  }, [resetToDashboard]);

  const handleCreateFolder = useCallback(() => {
    if (activeNode) {
      setCreateFolderTarget(activeNode);
    }
  }, [activeNode]);

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

  const handleCopyPathNotification = useCallback(() => {
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
    <div className='h-screen w-screen flex flex-col bg-background bg-glow overflow-hidden font-sans text-slate-100'>
      <Header
        onSelectFolder={handleSelectFolder}
        onDashboard={handleDashboard}
        onCreateFolder={handleCreateFolder}
        onRescan={handleRescan}
        onOpenSearchModal={handleOpenSearchModal}
        isScanning={isScanning}
        hasScanData={hasScanData}
        updateAvailable={updater.updateAvailable}
      />

      <AppRoutes
        isScanning={isScanning}
        hasScanData={hasScanData}
        scanCount={scanCount}
        scanStatusPath={scanStatusPath}
        flatNodes={flatNodes}
        currentId={currentId}
        breadcrumbIds={breadcrumbIds}
        diskInfo={diskInfo}
        hoveredNode={hoveredNode}
        selectedNode={selectedNode}
        activeNode={activeNode}
        searchQuery={searchQuery}
        onHoverNode={handleHoverNode}
        onSelectNode={handleSelectNode}
        onNavigate={handleNavigateTo}
        onContextMenu={handleContextMenu}
        onCopyPath={handleCopyPathNotification}
        onScanPath={handleScanPath}
        updater={updater}
      />

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          node={contextMenu.node}
          onClose={handleCloseContextMenu}
          onNavigate={handleNavigateTo}
          onReveal={handleReveal}
          onDelete={handlePendingDelete}
          onCreateSubfolder={handleCreateSubfolder}
          onCopyPath={handleCopyPathClipboard}
          onOpenInTerminal={handleOpenInTerminal}
        />
      )}

      <DeleteModal
        node={pendingDeleteNode}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isDeleting={isDeleting}
      />

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
