import React, { useState, useEffect } from "react";
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
import { applyThemeMode, applyFont, ThemeMode } from "./pages/SettingsPage";
import { FileNode } from "./types";

export const App: React.FC = () => {
  useAutoUpdater();
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
    scanHomeFolder,
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

  const handleScanPath = async (path: string) => {
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
  };

  const handleContextMenu = (e: React.MouseEvent, node: FileNode) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, node });
  };

  const handleReveal = async (path: string) => {
    try {
      await invoke("reveal_target_item", { targetPath: path });
    } catch (err: any) {
      showToast({ message: "Reveal Failed", description: err || "Could not open file manager", type: "error" });
    }
  };

  const handleConfirmDelete = async () => {
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
  };

  const hasScanData = flatNodes.length > 0;

  return (
    <div className='h-screen w-screen flex flex-col bg-background bg-glow overflow-hidden font-sans text-slate-100'>
      <Header
        onSelectFolder={() => {
          navigate("/");
          selectFolderDialog();
        }}
        onDashboard={() => {
          resetToDashboard();
        }}
        onCreateFolder={() => {
          if (activeNode) {
            setCreateFolderTarget(activeNode);
          }
        }}
        onHomeFolder={() => {
          navigate("/");
          scanHomeFolder();
        }}
        onRescan={() => rootPath && startScan(rootPath)}
        onOpenSearchModal={() => setIsSearchOpen(true)}
        isScanning={isScanning}
        hasScanData={hasScanData}
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
        onHoverNode={setHoveredNode}
        onSelectNode={setSelectedNode}
        onNavigate={navigateTo}
        onContextMenu={handleContextMenu}
        onCopyPath={() => showToast({ message: "Copied", description: "Path copied to clipboard", type: "success" })}
        onSelectFolder={() => {
          navigate("/");
          selectFolderDialog();
        }}
        onScanPath={handleScanPath}
      />

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          node={contextMenu.node}
          onClose={() => setContextMenu(null)}
          onNavigate={navigateTo}
          onReveal={handleReveal}
          onDelete={(node) => setPendingDeleteNode(node)}
          onCreateSubfolder={(node) => setCreateFolderTarget(node)}
          onCopyPath={(path) => {
            navigator.clipboard.writeText(path);
            showToast({ message: "Copied", description: "Path copied to clipboard", type: "success" });
          }}
        />
      )}

      <DeleteModal
        node={pendingDeleteNode}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDeleteNode(null)}
        isDeleting={isDeleting}
      />

      <CreateFolderModal
        isOpen={Boolean(createFolderTarget)}
        parentFolder={createFolderTarget}
        onClose={() => setCreateFolderTarget(null)}
        onFolderCreated={(newPath, folderName) => {
          if (createFolderTarget) {
            addFolderNode(createFolderTarget.id, newPath, folderName);
          }
        }}
      />

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        flatNodes={flatNodes}
        onNavigate={navigateTo}
        onSelectNode={setSelectedNode}
      />

      <ToastProvider />
    </div>
  );
};
