import React, { useCallback } from "react";
import {
  HardDrive,
  RefreshCw,
  Usb,
  ShieldAlert,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import { formatBytes } from "../utils/formatters";
import { showToast } from "../providers/ToastProvider";
import { Button } from "../components/ui/Button";
import { Container } from "../components/common/Container";
import { useSystemDrives } from "../hooks/useSystemDrives";
import { useFullDiskAccess } from "../hooks/useFullDiskAccess";
import { getFolderTheme } from "../utils/folderThemes";

interface HomePageProps {
  onScanPath: (path: string) => void;
  isScanning: boolean;
  scanCount: number;
  scanStatusPath: string;
}

const DriveCardSkeleton = () => (
  <div className='rounded-xl border border-surface-border bg-surface p-6 animate-pulse flex flex-col gap-4'>
    <div className='flex items-center justify-between'>
      <div className='flex items-center gap-3 flex-1'>
        <div className='w-8 h-8 rounded-lg bg-slate-800 shrink-0' />
        <div className='space-y-2 flex-1'>
          <div className='h-3.5 w-1/4 rounded-md bg-slate-800' />
          <div className='h-2.5 w-1/3 rounded-md bg-slate-800/70' />
        </div>
      </div>
      <div className='h-3 w-32 rounded-md bg-slate-800' />
    </div>
    <div className='h-5 w-full rounded-md bg-slate-800' />
    <div className='flex gap-4'>
      <div className='h-2.5 w-24 rounded bg-slate-800' />
      <div className='h-2.5 w-24 rounded bg-slate-800' />
    </div>
  </div>
);



export const HomePage: React.FC<HomePageProps> = React.memo(({ onScanPath, isScanning, scanCount: _scanCount, scanStatusPath: _scanStatusPath }) => {
  const { drives, folders, loading, refetch } = useSystemDrives();
  const { hasFDA, checkFDA, requestFDA } = useFullDiskAccess();





  const handleRequestFDA = useCallback(async () => {
    await requestFDA();
  }, [requestFDA]);

  const handleCheckStatus = useCallback(async () => {
    const allowed = await checkFDA();
    if (allowed) {
      showToast({
        message: "Access Granted",
        description: "Full Disk Access has been successfully enabled. Scanning will now run at maximum speed.",
        type: "success",
      });
    } else {
      showToast({
        message: "Status Checked",
        description: "Full Disk Access is not yet enabled. Please enable it in macOS System Settings.",
        type: "warning",
      });
    }
  }, [checkFDA]);

  return (
    <div className='flex-1 overflow-y-auto bg-background py-8 select-none relative scrollbar-none'>
      <Container maxWidth='6xl' className='space-y-10 px-4'>
        {/* Simplified Flat Header */}
        <header className='flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-surface-border pb-6'>
          <div className='space-y-1'>
            <h1 className='text-xl font-bold tracking-tight text-white sm:text-2xl'>Storage Analyzer</h1>
            <p className='text-xs text-slate-400'>Select a local volume or folder to scan storage usage.</p>
          </div>
          <div className='flex items-center gap-3 w-full md:w-auto'>
            <Button
              variant='outline'
              size='sm'
              onClick={refetch}
              isLoading={loading}
              leftIcon={<RefreshCw className='w-3.5 h-3.5' />}
              className='bg-surface border-surface-border hover:bg-surface-hover'
            >
              Refresh Volumes
            </Button>
          </div>
        </header>

        {/* Simplified FDA Warning banner */}
        {!hasFDA && (
          <div className='rounded-xl border border-amber-500/25 bg-amber-500/5 p-5 flex flex-col md:flex-row gap-5 items-start md:items-center justify-between animate-in slide-in-from-top-4 duration-300'>
            <div className='flex gap-4 items-start md:items-center'>
              <div className='w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0'>
                <ShieldAlert className='w-5 h-5' />
              </div>
              <div className='space-y-1'>
                <h4 className='text-xs font-bold text-amber-200 tracking-wide uppercase'>Full Disk Access Recommended (macOS)</h4>
                <p className='text-[11px] text-amber-400/80 max-w-2xl leading-relaxed'>
                  HyperDisk runs up to **5x faster** when given Full Disk Access permission. Enable it in macOS Settings.
                </p>
              </div>
            </div>
            <div className='flex gap-3 shrink-0 w-full md:w-auto mt-2 md:mt-0'>
              <Button
                variant='primary'
                onClick={handleRequestFDA}
                rightIcon={<ExternalLink className='w-3.5 h-3.5' />}
                className='bg-amber-500 hover:bg-amber-600 text-slate-900 border-none text-xs rounded-lg'
              >
                Grant Access
              </Button>
              <Button
                variant='secondary'
                onClick={handleCheckStatus}
                className='border-amber-500/30 text-amber-300 hover:bg-amber-500/10 text-xs rounded-lg'
              >
                Check Status
              </Button>
            </div>
          </div>
        )}

        {/* Local Volumes Section */}
        <section className='space-y-6'>
          <h3 className='text-xs font-bold uppercase tracking-widest text-slate-400'>Local Volumes</h3>

          <div className='grid grid-cols-1 gap-6'>
            {loading && drives.length === 0 && (
              <>
                <DriveCardSkeleton />
                <DriveCardSkeleton />
                <DriveCardSkeleton />
              </>
            )}
            {!loading && drives.length === 0 && (
              <div className='rounded-xl border border-dashed border-slate-700/50 p-12 flex flex-col items-center justify-center gap-3 bg-surface'>
                <HardDrive className='w-8 h-8 text-slate-600' />
                <p className='text-xs font-medium text-slate-500'>No mounted storage volumes found.</p>
              </div>
            )}
            {drives.map((drive, idx) => {
              const used = drive.total_space - drive.available_space;
              const pct = drive.total_space > 0 ? (used / drive.total_space) * 100 : 0;
              const clampedPct = Math.min(100, Math.max(0, pct));

              const isSystemDrive = drive.mount_point === "/" || drive.mount_point.toLowerCase().startsWith("c:");

              // Split used space into typical macOS categories for a realistic visual preview
              const appsPct = clampedPct * 0.35;
              const docsPct = clampedPct * 0.25;
              const devPct = clampedPct * 0.15;
              const musicPct = clampedPct * 0.1;
              const systemPct = clampedPct * 0.15;

              const Icon = drive.is_removable ? Usb : HardDrive;
              const isBrowseable = Boolean(drive.mount_point);

              return (
                <div
                  key={idx}
                  onClick={() => isBrowseable && !isScanning && onScanPath(drive.mount_point)}
                  className={`group rounded-xl border border-surface-border bg-surface p-6 flex flex-col gap-4 transition-all duration-200 ${
                    isBrowseable && !isScanning
                      ? "cursor-pointer hover:border-slate-500 hover:bg-surface-hover"
                      : "opacity-60 cursor-not-allowed"
                  }`}
                >
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-3'>
                      <div className='w-8 h-8 rounded-lg bg-background border border-surface-border flex items-center justify-center text-accent-purple shrink-0 group-hover:scale-105 transition-transform duration-200'>
                        <Icon className='w-4 h-4' />
                      </div>
                      <div>
                        <h4 className='text-sm font-bold text-slate-100 truncate' title={drive.name}>
                          {drive.name}
                        </h4>
                        <p className='text-[10px] text-slate-500 font-mono truncate' title={drive.mount_point}>
                          {drive.mount_point || "Unmounted"} • {drive.file_system || "Unknown"}
                        </p>
                      </div>
                    </div>
                    <div className='text-right'>
                      <span className='text-xs font-semibold text-slate-300'>
                        {formatBytes(used)} of {formatBytes(drive.total_space)} used
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Segmented Bar */}
                  <div className='h-5 w-full bg-slate-800/80 border border-slate-700/50 rounded-md overflow-hidden flex relative items-center'>
                    {isSystemDrive ? (
                      <>
                        <div className='h-full bg-[#ff453a] transition-all duration-300' style={{ width: `${docsPct}%` }} />
                        <div className='h-full bg-[#ff9f0a] transition-all duration-300' style={{ width: `${appsPct}%` }} />
                        <div className='h-full bg-[#ffd60a] transition-all duration-300' style={{ width: `${musicPct}%` }} />
                        <div className='h-full bg-[#30d158] transition-all duration-300' style={{ width: `${devPct}%` }} />
                        <div className='h-full bg-[#8e8e93] transition-all duration-300' style={{ width: `${systemPct}%` }} />
                      </>
                    ) : (
                      <div className='h-full bg-indigo-500/85 transition-all duration-300' style={{ width: `${clampedPct}%` }} />
                    )}
                    {/* Free segment */}
                    <div className='h-full flex-1 bg-slate-750/30 flex items-center justify-center font-mono text-[10px] font-bold text-slate-200'>
                      <span>{formatBytes(drive.available_space)} free</span>
                    </div>
                  </div>

                  {/* Legend dots */}
                  {isSystemDrive ? (
                    <div className='flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-400 font-medium'>
                      <div className='flex items-center gap-1.5'>
                        <span className='w-2 h-2 rounded-full bg-[#ff453a]' />
                        <span>Documents ({formatBytes(used * 0.25)})</span>
                      </div>
                      <div className='flex items-center gap-1.5'>
                        <span className='w-2 h-2 rounded-full bg-[#ff9f0a]' />
                        <span>Applications ({formatBytes(used * 0.35)})</span>
                      </div>
                      <div className='flex items-center gap-1.5'>
                        <span className='w-2 h-2 rounded-full bg-[#ffd60a]' />
                        <span>Music Creation ({formatBytes(used * 0.1)})</span>
                      </div>
                      <div className='flex items-center gap-1.5'>
                        <span className='w-2 h-2 rounded-full bg-[#30d158]' />
                        <span>Developer ({formatBytes(used * 0.15)})</span>
                      </div>
                      <div className='flex items-center gap-1.5'>
                        <span className='w-2 h-2 rounded-full bg-[#8e8e93]' />
                        <span>System Data ({formatBytes(used * 0.15)})</span>
                      </div>
                      <div className='flex items-center gap-1.5'>
                        <span className='w-2 h-2 rounded-full bg-slate-700' />
                        <span>Free Space ({formatBytes(drive.available_space)})</span>
                      </div>
                    </div>
                  ) : (
                    <div className='flex items-center gap-4 text-[10px] text-slate-400 font-medium'>
                      <div className='flex items-center gap-1.5'>
                        <span className='w-2 h-2 rounded-full bg-indigo-500' />
                        <span>Used ({formatBytes(used)})</span>
                      </div>
                      <div className='flex items-center gap-1.5'>
                        <span className='w-2 h-2 rounded-full bg-slate-700' />
                        <span>Available ({formatBytes(drive.available_space)})</span>
                      </div>
                      {drive.is_removable && (
                        <span className='px-1.5 py-0.2 rounded bg-amber-500/10 border border-amber-500/20 text-[8px] font-bold text-amber-400 uppercase font-mono ml-auto'>
                          Removable
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* System Folders */}
        {folders.length > 0 && (
          <section className='space-y-6'>
            <h3 className='text-xs font-bold uppercase tracking-widest text-slate-400'>System Folders</h3>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'>
              {folders.map((folder, idx) => {
                const theme = getFolderTheme(folder.name);
                const FolderIcon = theme.Icon;

                return (
                  <div
                    key={idx}
                    onClick={() => !isScanning && onScanPath(folder.path)}
                    className={`group rounded-xl border border-surface-border bg-surface p-4 flex items-center justify-between gap-4 transition-all duration-200 ${
                      !isScanning ? "cursor-pointer hover:border-slate-500 hover:bg-surface-hover" : "opacity-60 cursor-not-allowed"
                    }`}
                  >
                    <div className='min-w-0 flex-1 flex items-center gap-4'>
                      <div
                        className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 ${theme.color} transition-transform duration-200 group-hover:scale-105`}
                      >
                        <FolderIcon className='w-4.5 h-4.5' />
                      </div>
                      <div className='min-w-0 flex-1 space-y-0.5'>
                        <div className='flex items-center gap-2'>
                          <h4 className='text-xs font-bold text-slate-100 truncate'>{folder.name}</h4>
                        </div>
                        <p className='text-[10px] text-slate-500 font-mono truncate'>{folder.path}</p>
                      </div>
                    </div>

                    <ArrowRight className='w-3.5 h-3.5 text-slate-600 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-slate-300 shrink-0' />
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </Container>
    </div>
  );
});