import React, { useCallback } from "react";
import { HardDrive, Folder, RefreshCw, Usb, ShieldAlert, ExternalLink } from "lucide-react";
import { formatBytes } from "../utils/formatters";
import { showToast } from "../providers/ToastProvider";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Container } from "../components/common/Container";
import { useSystemDrives } from "../hooks/useSystemDrives";
import { useFullDiskAccess } from "../hooks/useFullDiskAccess";

interface HomePageProps {
  onScanPath: (path: string) => void;
  isScanning: boolean;
  scanCount: number;
  scanStatusPath: string;
}

const DriveCardSkeleton = () => (
  <div className='rounded-xl border border-surface-border bg-surface/30 p-5 animate-pulse'>
    <div className='flex items-center gap-4'>
      <div className='w-10 h-10 rounded-lg bg-slate-800' />
      <div className='flex-1 space-y-2.5'>
        <div className='h-3 w-2/3 rounded-md bg-slate-800' />
        <div className='h-2 w-1/2 rounded-md bg-slate-800/70' />
      </div>
    </div>
    <div className='mt-5 space-y-2'>
      <div className='h-1.5 w-full rounded-full bg-slate-800' />
      <div className='flex justify-between'>
        <div className='h-2 w-16 rounded bg-slate-800/50' />
        <div className='h-2 w-16 rounded bg-slate-800/50' />
      </div>
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
    <div className='flex-1 overflow-y-auto bg-background py-6 sm:py-8 select-none'>
      <Container maxWidth='6xl' className='space-y-12'>
        {/* FDA Warning */}
        {!hasFDA && (
          <div className='rounded-xl border border-surface-border bg-surface/30 p-5 flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between'>
            <div className='flex gap-4 items-start sm:items-center'>
              <div className='w-10 h-10 rounded-lg bg-surface border border-surface-border text-accent-purple flex items-center justify-center shrink-0'>
                <ShieldAlert className='w-5 h-5' />
              </div>
              <div className='space-y-1'>
                <h4 className='text-sm font-bold text-slate-200 tracking-wide'>Full Disk Access Required (macOS)</h4>
                <p className='text-xs text-slate-400 max-w-2xl leading-relaxed'>
                  Without this permission, scanning is significantly slower (due to OS sandboxing checks) and will trigger repetitive
                  prompts. Enable it for 1-2s blazing fast scans.
                </p>
              </div>
            </div>
            <div className='flex gap-3 shrink-0 w-full sm:w-auto mt-2 sm:mt-0'>
              <Button
                variant="primary"
                onClick={handleRequestFDA}
                rightIcon={<ExternalLink className='w-3.5 h-3.5' />}
              >
                Grant Access
              </Button>
              <Button
                variant="secondary"
                onClick={handleCheckStatus}
              >
                Check Status
              </Button>
            </div>
          </div>
        )}

        {/* Drives Section */}
        <section>
          <div className='flex items-center justify-between mb-6'>
            <h3 className='text-sm font-bold uppercase tracking-widest text-slate-200'>Local Drives</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={refetch}
              isLoading={loading}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refresh
            </Button>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'>
            {loading && drives.length === 0 && (
              <>
                <DriveCardSkeleton />
                <DriveCardSkeleton />
                <DriveCardSkeleton />
              </>
            )}
            {!loading && drives.length === 0 && (
              <div className='sm:col-span-2 lg:col-span-3 rounded-xl border-2 border-dashed border-slate-700/50 p-10 flex flex-col items-center justify-center gap-3'>
                <HardDrive className='w-8 h-8 text-slate-600' />
                <p className='text-sm font-medium text-slate-400'>No drives detected.</p>
              </div>
            )}
            {drives.map((drive, idx) => {
              const used = drive.total_space - drive.available_space;
              const pct = drive.total_space > 0 ? (used / drive.total_space) * 100 : 0;
              const clampedPct = Math.min(100, Math.max(0, pct));
              const Icon = drive.is_removable ? Usb : HardDrive;
              const isBrowseable = Boolean(drive.mount_point);

              return (
                <Card
                  key={idx}
                  as={isBrowseable ? "button" : "div"}
                  variant={isBrowseable ? "interactive" : "default"}
                  onClick={() => isBrowseable && onScanPath(drive.mount_point)}
                  className={`flex flex-col gap-5 ${!isBrowseable ? "opacity-50 cursor-not-allowed grayscale" : ""} ${isScanning ? "pointer-events-none" : ""}`}
                >
                  <div className='flex items-center gap-4'>
                    <div className='w-10 h-10 rounded-lg bg-surface border border-surface-border flex items-center justify-center text-accent-purple shrink-0'>
                      <Icon className='w-5 h-5' />
                    </div>
                    <div className='min-w-0 flex-1'>
                      <h4 className='text-sm font-bold text-slate-100 truncate' title={drive.name}>
                        {drive.name}
                      </h4>
                      <p className='text-xs text-slate-400 font-mono mt-0.5 truncate' title={drive.mount_point}>
                        {drive.mount_point || "Unmounted"}
                      </p>
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <div className='w-full h-1.5 rounded-full bg-slate-800 overflow-hidden'>
                      <div className='h-full bg-accent-blue rounded-full' style={{ width: `${clampedPct}%` }} />
                    </div>
                    <div className='flex justify-between text-[11px] text-slate-400 font-mono'>
                      <span>{formatBytes(used)} used</span>
                      <span>{formatBytes(drive.available_space)} free</span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Quick Access Folders */}
        {folders.length > 0 && (
          <section>
            <h3 className='text-sm font-bold uppercase tracking-widest text-slate-200 mb-6'>Quick Access</h3>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'>
              {folders.map((folder, idx) => (
                <Card
                  key={idx}
                  as='button'
                  variant='interactive'
                  onClick={() => onScanPath(folder.path)}
                  className={`flex items-center gap-4 ${isScanning ? "pointer-events-none" : ""}`}
                >
                  <div className='w-10 h-10 rounded-lg bg-surface border border-surface-border flex items-center justify-center text-accent-purple shrink-0'>
                    <Folder className='w-5 h-5' />
                  </div>
                  <div className='min-w-0 flex-1'>
                    <h4 className='text-sm font-bold text-slate-100 truncate'>{folder.name}</h4>
                    <p className='text-xs text-slate-400 font-mono mt-0.5 truncate'>{folder.path}</p>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}
      </Container>
    </div>
  );
});