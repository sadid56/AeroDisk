import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Loader2, HardDrive } from 'lucide-react';
import { AnalyzerPage } from '../pages/AnalyzerPage';
import { SettingsPage } from '../pages/SettingsPage';
import { WelcomeDashboard } from '../components/WelcomeDashboard';
import { FileNode, DiskSpaceInfo } from '../types';

interface AppRoutesProps {
  isScanning: boolean;
  hasScanData: boolean;
  scanCount: number;
  scanStatusPath: string;
  flatNodes: FileNode[];
  currentId: number | null;
  breadcrumbIds: number[];
  diskInfo: DiskSpaceInfo | null;
  hoveredNode: FileNode | null;
  selectedNode: FileNode | null;
  activeNode: FileNode | null;
  searchQuery: string;
  onHoverNode: (node: FileNode | null) => void;
  onSelectNode: (node: FileNode | null) => void;
  onNavigate: (id: number) => void;
  onContextMenu: (e: React.MouseEvent, node: FileNode) => void;
  onCopyPath: () => void;
  onSelectFolder: () => void;
  onScanPath: (path: string) => void;
}

export const AppRoutes: React.FC<AppRoutesProps> = ({
  isScanning,
  hasScanData,
  scanCount,
  scanStatusPath,
  flatNodes,
  currentId,
  breadcrumbIds,
  diskInfo,
  hoveredNode,
  selectedNode,
  activeNode,
  searchQuery,
  onHoverNode,
  onSelectNode,
  onNavigate,
  onContextMenu,
  onCopyPath,
  onSelectFolder,
  onScanPath,
}) => {
  const navigate = useNavigate();

  return (
    <Routes>
      <Route
        path="/"
        element={
          isScanning ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-accent-purple via-accent-pink to-accent-blue flex items-center justify-center shadow-xl shadow-accent-purple/30 animate-pulse">
                  <HardDrive className="w-8 h-8 text-white" />
                </div>
                <Loader2 className="w-6 h-6 text-accent-purple animate-spin absolute -bottom-2 -right-2 bg-surface p-1 rounded-full border border-surface-border" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-100">Indexing Storage</h2>
                <p className="text-xs text-slate-400 font-mono mt-1 max-w-md truncate">
                  {scanCount.toLocaleString()} items processed
                </p>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5 max-w-lg truncate">
                  {scanStatusPath}
                </p>
              </div>
            </div>
          ) : hasScanData ? (
            <AnalyzerPage
              flatNodes={flatNodes}
              currentId={currentId}
              breadcrumbIds={breadcrumbIds}
              diskInfo={diskInfo}
              hoveredNode={hoveredNode}
              selectedNode={selectedNode}
              activeNode={activeNode}
              searchQuery={searchQuery}
              onHoverNode={onHoverNode}
              onSelectNode={onSelectNode}
              onNavigate={onNavigate}
              onContextMenu={onContextMenu}
              onCopyPath={onCopyPath}
            />
          ) : (
            <WelcomeDashboard
              onSelectFolder={onSelectFolder}
              onScanPath={onScanPath}
              isScanning={isScanning}
            />
          )
        }
      />
      <Route
        path="/settings"
        element={<SettingsPage onBackToAnalyzer={() => navigate('/')} />}
      />
    </Routes>
  );
};
