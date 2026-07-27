import React, { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { HardDrive, Folder, RefreshCw, Usb, HardDriveDownload } from "lucide-react";
import { SystemDrive, UserFolder } from "../types";
import { formatBytes } from "../utils/formatters";

interface WelcomeDashboardProps {
  onScanPath: (path: string) => void;
  isScanning: boolean;
  scanCount: number;
  scanStatusPath: string;
}

const usageColor = (pct: number) => {
  if (pct >= 90) return "#f87171"; // red-400
  if (pct >= 70) return "#fbbf24"; // amber-400
  return "#818cf8"; // indigo-400
};

const DriveCardSkeleton = () => (
  <div className='rounded-xl border border-surface-border bg-background/60 p-4 animate-pulse'>
    <div className='flex items-center gap-3'>
      <div className='w-9 h-9 rounded-lg bg-slate-800' />
      <div className='flex-1 space-y-2'>
        <div className='h-2.5 w-2/3 rounded bg-slate-800' />
        <div className='h-2 w-1/2 rounded bg-slate-800/70' />
      </div>
    </div>
    <div className='mt-4 h-1 w-full rounded-full bg-slate-800' />
  </div>
);

export const WelcomeDashboard: React.FC<WelcomeDashboardProps> = ({ onScanPath, isScanning, scanCount, scanStatusPath }) => {
  const [drives, setDrives] = useState<SystemDrive[]>([]);
  const [folders, setFolders] = useState<UserFolder[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedDrives, fetchedFolders] = await Promise.all([
        invoke<SystemDrive[]>("fetch_system_drives"),
        invoke<UserFolder[]>("fetch_user_folders"),
      ]);
      setDrives(fetchedDrives || []);
      setFolders(fetchedFolders || []);
    } catch (err) {
      console.error("Failed to fetch system drives or user folders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className='flex-1 flex flex-col items-center justify-start p-6 sm:p-8 overflow-y-auto bg-background'>
      <div className='max-w-5xl w-full space-y-10'>
        {/* Scanning progress pill – subtle but present */}
        {isScanning && (
          <div className='sticky top-0 z-10 mb-1 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-surface-hover/70 backdrop-blur-md border border-slate-500/30 text-sm text-slate-200 shadow-sm'>
            <span className='relative flex h-3 w-3 shrink-0'>
              <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-purple opacity-40'></span>
              <span className='relative inline-flex rounded-full h-3 w-3 bg-accent-purple'></span>
            </span>
            <span className='font-medium text-xs tracking-wide'>Indexing {scanCount.toLocaleString()} items</span>
            <span className='truncate text-[11px] text-slate-400 ml-auto max-w-[180px]' title={scanStatusPath}>
              {scanStatusPath}
            </span>
          </div>
        )}

        {/* Header – minimal, welcoming */}
        <div className='space-y-1'>
          <div className='w-10 h-10 rounded-xl bg-surface border border-surface-border flex items-center justify-center text-accent-purple mb-3 shadow-sm'>
            <HardDriveDownload className='w-5 h-5' />
          </div>
          <p className='text-sm text-slate-400'>Choose a drive or folder to scan and reclaim disk space.</p>
        </div>

        {/* Drives Section */}
        <section>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-xs font-semibold uppercase tracking-[0.1em] text-slate-500'>Drives</h3>
            <button
              onClick={loadData}
              disabled={loading}
              className='flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-200 disabled:opacity-50 transition-colors px-2.5 py-1 rounded-lg hover:bg-surface'
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
            {loading && drives.length === 0 && (
              <>
                <DriveCardSkeleton />
                <DriveCardSkeleton />
                <DriveCardSkeleton />
              </>
            )}
            {!loading && drives.length === 0 && (
              <div className='sm:col-span-2 lg:col-span-3 rounded-xl border border-dashed border-surface-border p-6 text-center'>
                <p className='text-sm text-slate-400'>No drives detected.</p>
              </div>
            )}
            {drives.map((drive, idx) => {
              const used = drive.total_space - drive.available_space;
              const pct = drive.total_space > 0 ? (used / drive.total_space) * 100 : 0;
              const clampedPct = Math.min(100, Math.max(0, pct));
              const Icon = drive.is_removable ? Usb : HardDrive;
              const isBrowseable = Boolean(drive.mount_point);

              return (
                <button
                  key={idx}
                  onClick={() => isBrowseable && onScanPath(drive.mount_point)}
                  disabled={isScanning || !isBrowseable}
                  className={`group text-left rounded-xl border bg-background/60 border-surface-border hover:bg-surface-hover hover:border-slate-500 transition-all p-4 flex flex-col gap-4 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-purple/50 ${
                    !isBrowseable ? "opacity-60 cursor-not-allowed border-dashed" : ""
                  } ${isScanning ? "pointer-events-none" : ""}`}
                  title={isBrowseable ? `Scan ${drive.name}` : `${drive.name} (not mounted)`}
                >
                  <div className='flex gap-3'>
                    <div className='w-9 h-9 rounded-lg bg-slate-800/70 text-slate-400 group-hover:text-accent-purple flex items-center justify-center shrink-0 transition-colors'>
                      <Icon className='w-4 h-4' />
                    </div>
                    <div className='flex items-center justify-between w-full gap-2'>
                      <h4 className='text-sm font-semibold text-slate-200 truncate'>{drive.name}</h4>

                      <span className='text-xs font-mono font-semibold text-slate-400 shrink-0 pt-0.5'>{Math.round(clampedPct)}%</span>
                    </div>
                  </div>
                  <div className='space-y-1.5'>
                    <div className='h-1.5 w-full bg-slate-800/80 rounded-full overflow-hidden'>
                      <div
                        className='h-full rounded-full transition-all duration-500'
                        style={{ width: `${clampedPct}%`, backgroundColor: usageColor(clampedPct) }}
                      />
                    </div>
                    <div className='flex justify-between text-[10px] font-mono text-slate-500'>
                      <span>{formatBytes(used)} used</span>
                      <span>{formatBytes(drive.available_space)} free</span>
                    </div>
                    {!isBrowseable && <p className='text-[10px] text-slate-500 mt-1'>Drive not mounted</p>}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Quick Access Folders */}
        {(folders.length > 0 || loading) && (
          <section>
            <h3 className='text-xs font-semibold uppercase tracking-[0.1em] text-slate-500 mb-4'>Quick access</h3>
            <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3'>
              {loading &&
                folders.length === 0 &&
                Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className='rounded-xl border border-surface-border bg-background/60 p-3 flex items-center gap-2.5 animate-pulse'
                  >
                    <div className='w-7 h-7 rounded-md bg-slate-800' />
                    <div className='h-2.5 w-16 rounded bg-slate-800' />
                  </div>
                ))}
              {folders.map((folder, idx) => (
                <button
                  key={idx}
                  onClick={() => onScanPath(folder.path)}
                  disabled={isScanning}
                  className='group cursor-pointer text-left rounded-xl border bg-background/60 border-surface-border hover:bg-surface-hover hover:border-slate-500 transition-all p-3 flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-purple/50'
                  title={`Scan ${folder.name}`}
                >
                  <div className='w-7 h-7 rounded-md bg-slate-800/70 text-slate-400 group-hover:text-amber-400 flex items-center justify-center shrink-0 transition-colors'>
                    <Folder className='w-3.5 h-3.5' />
                  </div>
                  <div className='min-w-0 flex-1'>
                    <h4 className='text-xs font-medium text-slate-300 group-hover:text-slate-100 truncate'>{folder.name}</h4>
                    <p className='text-[10px] text-slate-500 font-mono truncate'>{folder.path}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
