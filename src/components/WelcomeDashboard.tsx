import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
  FolderOpen,
  HardDrive,
  Folder,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Usb,
} from 'lucide-react';
import { SystemDrive, UserFolder } from '../types';
import { formatBytes } from '../utils/formatters';

interface WelcomeDashboardProps {
  onSelectFolder: () => void;
  onScanPath: (path: string) => void;
  isScanning: boolean;
}

export const WelcomeDashboard: React.FC<WelcomeDashboardProps> = ({
  onSelectFolder,
  onScanPath,
  isScanning,
}) => {
  const [drives, setDrives] = useState<SystemDrive[]>([]);
  const [folders, setFolders] = useState<UserFolder[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedDrives, fetchedFolders] = await Promise.all([
        invoke<SystemDrive[]>('fetch_system_drives'),
        invoke<UserFolder[]>('fetch_user_folders'),
      ]);
      setDrives(fetchedDrives || []);
      setFolders(fetchedFolders || []);
    } catch (err) {
      console.error('Failed to fetch system drives or user folders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto bg-background bg-glow">
      <div className="max-w-4xl w-full space-y-8 animate-in fade-in zoom-in-95 duration-200">

        {/* Hero Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-purple/15 border border-accent-purple/30 text-accent-purple text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Fast Cross-Platform Disk Analyzer</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100 font-sans">
            Select a Drive or Directory
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
            Click any detected disk drive, mount point, or user location below to start indexing disk usage.
          </p>
        </div>

        {/* Primary Action Button */}
        <div className="flex justify-center">
          <button
            onClick={onSelectFolder}
            disabled={isScanning}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-accent-purple via-accent-pink to-accent-blue text-white font-semibold text-sm shadow-xl shadow-accent-purple/25 hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-3 border border-white/10"
          >
            <FolderOpen className="w-5 h-5" />
            <span>Browse Custom Folder...</span>
            <ArrowRight className="w-4 h-4 ml-1 opacity-70" />
          </button>
        </div>

        {/* Mounted System Drives Section */}
        <div>
          <div className="flex items-center justify-between mb-3.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Detected Storage Drives
            </h3>
            <button
              onClick={loadData}
              className="p-1 text-slate-400 hover:text-white transition-colors"
              title="Refresh drives"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {drives.map((drive, idx) => {
              const used = drive.total_space - drive.available_space;
              const pct = drive.total_space > 0 ? (used / drive.total_space) * 100 : 0;
              const Icon = drive.is_removable ? Usb : HardDrive;

              return (
                <button
                  key={idx}
                  onClick={() => onScanPath(drive.mount_point)}
                  disabled={isScanning}
                  className="group text-left p-4 rounded-xl bg-surface/80 border border-surface-border hover:bg-surface-hover hover:border-accent-purple/50 transition-all flex flex-col justify-between gap-3 shadow-md hover:shadow-accent-purple/10"
                >
                  <div className="flex items-start justify-between gap-3 w-full">
                    <div className="w-10 h-10 rounded-xl bg-accent-purple/15 border border-accent-purple/30 text-accent-purple flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-slate-100 group-hover:text-white truncate" title={drive.name}>
                        {drive.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-mono truncate" title={drive.mount_point}>
                        {drive.mount_point}
                      </p>
                    </div>
                  </div>

                  <div className="w-full space-y-1.5 pt-1">
                    <div className="h-1.5 w-full bg-background rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-accent-purple to-accent-blue rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>{formatBytes(used)} used</span>
                      <span className="text-accent-teal font-semibold">{formatBytes(drive.available_space)} free</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* User Folders Section */}
        {folders.length > 0 && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3.5">
              User Directories
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {folders.map((folder, idx) => (
                <button
                  key={idx}
                  onClick={() => onScanPath(folder.path)}
                  disabled={isScanning}
                  className="group text-left p-3 rounded-xl bg-surface/60 border border-surface-border hover:bg-surface-hover hover:border-slate-600 transition-all flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-surface border border-surface-border text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Folder className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">
                      {folder.name}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-mono truncate" title={folder.path}>
                      {folder.path}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
