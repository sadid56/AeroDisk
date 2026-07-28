import React from 'react';
import { Routes, Route, useNavigate } from "react-router-dom";
import { AnalyzerPage } from '../pages/AnalyzerPage';
import { SettingsPage } from '../pages/SettingsPage';
import { HomePage } from '../pages/HomePage';
import { UpdatesPage } from '../pages/UpdatesPage';
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
  onScanPath: (path: string) => void;
  updater: any;
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
  onScanPath,
  updater,
}) => {
  const navigate = useNavigate();

  return (
    <Routes>
      <Route
        path='/'
        element={
          hasScanData || isScanning ? (
            <AnalyzerPage
              flatNodes={flatNodes}
              currentId={currentId}
              breadcrumbIds={breadcrumbIds}
              diskInfo={diskInfo}
              hoveredNode={hoveredNode}
              selectedNode={selectedNode}
              activeNode={activeNode}
              searchQuery={searchQuery}
              isScanning={isScanning}
              scanCount={scanCount}
              scanStatusPath={scanStatusPath}
              onHoverNode={onHoverNode}
              onSelectNode={onSelectNode}
              onNavigate={onNavigate}
              onContextMenu={onContextMenu}
            />
          ) : (
            <HomePage onScanPath={onScanPath} isScanning={isScanning} scanCount={scanCount} scanStatusPath={scanStatusPath} />
          )
        }
      />
      <Route path='/settings' element={<SettingsPage onBackToAnalyzer={() => navigate("/")} />} />
      <Route path='/updates' element={<UpdatesPage onBack={() => navigate("/settings")} updater={updater} />} />
    </Routes>
  );
};
