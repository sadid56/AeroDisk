import React from 'react';
import { Routes, Route, useNavigate } from "react-router-dom";
import { Folder } from "lucide-react";
import { AnalyzerPage } from '../pages/AnalyzerPage';
import { SettingsPage } from '../pages/SettingsPage';
import { DashboardPage } from '../pages/DashboardPage';
import { VolumesPage } from '../pages/VolumesPage';
import { FoldersPage } from '../pages/FoldersPage';
import { LargeFilesPage } from '../pages/LargeFilesPage';
import { DuplicatesPage } from '../pages/DuplicatesPage';
import { CleanupPage } from '../pages/CleanupPage';

import { UpdatesPage } from '../pages/UpdatesPage';
import { Button } from "../components/ui/Button";
import { FileNode, SystemDrive, UserFolder, LargeFile, CleanupSuggestion, DuplicateGroup } from '../types';

interface AppRoutesProps {
  isScanning: boolean;
  hasScanData: boolean;
  scanCount: number;
  scanStatusPath: string;
  flatNodes: FileNode[];
  currentId: number | null;
  breadcrumbIds: number[];
  hoveredNode: FileNode | null;
  selectedNode: FileNode | null;
  activeNode: FileNode | null;
  searchQuery: string;
  onHoverNode: (node: FileNode | null) => void;
  onSelectNode: (node: FileNode | null) => void;
  onNavigate: (id: number) => void;
  onContextMenu: (e: React.MouseEvent, node: FileNode) => void;
  onScanPath: (path: string) => void;
  onSelectFolder: () => void;
  updater: any;
  drives: SystemDrive[];
  folders: UserFolder[];
  drivesLoading: boolean;
  largeFiles: LargeFile[];
  cleanupSuggestions: CleanupSuggestion[];
  duplicateGroups: DuplicateGroup[];
  toolsLoading: boolean;
  onRefreshTools: () => void;
  onBackToOrigin: () => void;
}

export const AppRoutes: React.FC<AppRoutesProps> = ({
  isScanning,
  hasScanData,
  scanCount,
  scanStatusPath,
  flatNodes,
  currentId,
  breadcrumbIds,
  hoveredNode,
  selectedNode,
  activeNode,
  searchQuery,
  onHoverNode,
  onSelectNode,
  onNavigate,
  onContextMenu,
  onScanPath,
  onSelectFolder,
  onBackToOrigin,
  updater,
  drives,
  folders,
  drivesLoading,
  largeFiles,
  cleanupSuggestions,
  duplicateGroups,
  toolsLoading,
  onRefreshTools,
}) => {
  const navigate = useNavigate();

  return (
    <Routes>
      <Route
        path='/'
        element={
          <DashboardPage
            drives={drives}
            folders={folders}
            isLoading={drivesLoading}
            onScanPath={onScanPath}
            onNavigateTab={(tab) => navigate(`/${tab === "overview" ? "" : tab}`)}
          />
        }
      />
      <Route
        path='/analyzer'
        element={
          hasScanData || isScanning ? (
            <AnalyzerPage
              flatNodes={flatNodes}
              currentId={currentId}
              breadcrumbIds={breadcrumbIds}
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
              onBackToOrigin={onBackToOrigin}
            />
          ) : (
            <div className='flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6 max-w-sm mx-auto my-auto animate-in fade-in duration-200'>
              <div className='w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shadow-lg'>
                <Folder className='w-8 h-8' />
              </div>
              <div className='space-y-2'>
                <h2 className='text-lg font-bold text-slate-100'>No Active Scan</h2>
                <p className='text-xs text-slate-400 leading-relaxed'>
                  Select a folder to begin analyzing your storage space, finding large files, and visualizing disk hierarchy.
                </p>
              </div>
              <Button
                variant='primary'
                onClick={onSelectFolder}
                size='md'
              >
                Select Folder to Analyze
              </Button>
            </div>
          )
        }
      />
      <Route
        path='/volumes'
        element={<VolumesPage drives={drives} isScanning={isScanning} onScanPath={onScanPath} />}
      />
      <Route
        path='/folders'
        element={<FoldersPage folders={folders} isScanning={isScanning} onScanPath={onScanPath} />}
      />
      <Route path='/large-files' element={<LargeFilesPage largeFiles={largeFiles} loading={toolsLoading} onRefresh={onRefreshTools} />} />
      <Route path='/duplicates' element={<DuplicatesPage duplicateGroups={duplicateGroups} loading={toolsLoading} onRefresh={onRefreshTools} />} />
      <Route path='/cleanup' element={<CleanupPage cleanupSuggestions={cleanupSuggestions} loading={toolsLoading} onRefresh={onRefreshTools} />} />
      <Route path='/settings' element={<SettingsPage onBackToAnalyzer={() => navigate("/analyzer")} />} />

      <Route path='/updates' element={<UpdatesPage onBack={() => navigate("/settings")} updater={updater} />} />
    </Routes>
  );
};
