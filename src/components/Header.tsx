import React from 'react';
import { FolderOpen, Home, RefreshCw, Search, HardDrive, Zap } from 'lucide-react';

interface HeaderProps {
  onSelectFolder: () => void;
  onHomeFolder: () => void;
  onRescan: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isScanning: boolean;
  hasScanData: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onSelectFolder,
  onHomeFolder,
  onRescan,
  searchQuery,
  onSearchChange,
  isScanning,
  hasScanData,
}) => {
  return (
    <header className="h-16 px-6 bg-surface/80 backdrop-blur-xl border-b border-surface-border flex items-center justify-between z-20 shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-accent-purple via-accent-pink to-accent-blue flex items-center justify-center shadow-lg shadow-accent-purple/20">
          <HardDrive className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-base tracking-tight text-slate-100 font-sans">AeroDisk</h1>
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-accent-purple/15 text-accent-purple border border-accent-purple/30 rounded-full flex items-center gap-1">
              <Zap className="w-2.5 h-2.5" /> Rust v2
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Cross-Platform Storage Analyzer</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {hasScanData && (
          <div className="relative w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-background/60 border border-surface-border rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-accent-purple/60 focus:ring-1 focus:ring-accent-purple/30 transition-all"
            />
          </div>
        )}

        <button
          onClick={onHomeFolder}
          disabled={isScanning}
          title="Scan Home Directory"
          className="p-2 rounded-lg bg-surface border border-surface-border text-slate-300 hover:text-white hover:bg-surface-hover hover:border-slate-700 disabled:opacity-50 transition-all"
        >
          <Home className="w-4 h-4" />
        </button>

        {hasScanData && (
          <button
            onClick={onRescan}
            disabled={isScanning}
            title="Rescan Directory"
            className="p-2 rounded-lg bg-surface border border-surface-border text-slate-300 hover:text-white hover:bg-surface-hover hover:border-slate-700 disabled:opacity-50 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin text-accent-purple' : ''}`} />
          </button>
        )}

        <button
          onClick={onSelectFolder}
          disabled={isScanning}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-accent-purple to-accent-blue text-white font-medium text-xs shadow-md shadow-accent-purple/20 hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2"
        >
          <FolderOpen className="w-4 h-4" />
          <span>Choose Directory</span>
        </button>
      </div>
    </header>
  );
};
