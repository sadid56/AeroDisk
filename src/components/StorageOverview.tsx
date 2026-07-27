import React from 'react';
import { HardDrive, Layers } from 'lucide-react';
import { DiskSpaceInfo } from '../types';
import { formatBytes } from '../utils/formatters';

interface StorageOverviewProps {
  diskInfo: DiskSpaceInfo | null;
  scannedPath?: string;
  totalItems: number;
}

export const StorageOverview: React.FC<StorageOverviewProps> = ({
  diskInfo,
  scannedPath,
  totalItems,
}) => {
  const used = diskInfo ? diskInfo.total - diskInfo.available : 0;
  const percentage = diskInfo && diskInfo.total > 0 ? (used / diskInfo.total) * 100 : 0;

  return (
    <div className="bg-surface/50 border-b border-surface-border px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 text-xs">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-1.5 text-slate-300 font-medium truncate">
          <HardDrive className="w-4 h-4 text-accent-purple shrink-0" />
          <span className="text-slate-400">Target:</span>
          <span className="text-slate-100 font-mono truncate" title={scannedPath}>
            {scannedPath || 'None'}
          </span>
        </div>

        <div className="h-3.5 w-px bg-surface-border hidden sm:block" />

        <div className="flex items-center gap-1.5 text-slate-300 font-medium shrink-0">
          <Layers className="w-3.5 h-3.5 text-accent-teal" />
          <span className="text-slate-400">Scanned:</span>
          <span className="text-slate-100 font-mono font-semibold">
            {totalItems.toLocaleString()} items
          </span>
        </div>
      </div>

      {diskInfo && (
        <div className="flex items-center gap-4 min-w-[280px]">
          <div className="flex-1">
            <div className="flex justify-between items-center text-[11px] mb-1.5">
              <span className="text-slate-400 font-medium">Storage Usage</span>
              <span className="text-slate-300 font-mono font-semibold">
                {formatBytes(used)} / {formatBytes(diskInfo.total)} ({percentage.toFixed(1)}%)
              </span>
            </div>
            <div className="h-2 w-full bg-background rounded-full overflow-hidden p-0.5 border border-surface-border">
              <div
                className="h-full bg-gradient-to-r from-accent-purple via-accent-pink to-accent-blue rounded-full transition-all duration-500 shadow-sm shadow-accent-purple/50"
                style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
              />
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider">Free Space</span>
            <span className="text-accent-teal font-mono font-bold text-xs">{formatBytes(diskInfo.available)}</span>
          </div>
        </div>
      )}
    </div>
  );
};
