import React from "react";
import { HardDrive, Usb } from "lucide-react";
import { formatBytes } from "../utils/formatters";
import { SystemDrive } from "../types";

interface VolumesPageProps {
  drives: SystemDrive[];
  isScanning: boolean;
  onScanPath: (path: string) => void;
}

export const VolumesPage: React.FC<VolumesPageProps> = ({
  drives,
  isScanning,
  onScanPath,
}) => {
  return (
    <div className='flex-1 overflow-y-auto p-6 space-y-6 select-none scrollbar-none animate-in fade-in duration-300'>
      <div className='flex items-center justify-between border-b border-surface-border pb-4'>
        <div>
          <h2 className='text-lg font-bold text-white'>Local Volumes</h2>
          <p className='text-xs text-slate-500'>Select a local storage volume or removable disk to scan storage distribution.</p>
        </div>
      </div>

      <div className='grid grid-cols-1 gap-6'>
        {drives.length === 0 ? (
          <div className='rounded-xl border border-dashed border-slate-700/50 p-12 flex flex-col items-center justify-center gap-3 bg-surface'>
            <HardDrive className='w-8 h-8 text-slate-600 animate-pulse' />
            <p className='text-xs font-medium text-slate-500'>No mounted storage volumes found.</p>
          </div>
        ) : (
          drives.map((drive, idx) => {
            const used = drive.total_space - drive.available_space;
            const pct = drive.total_space > 0 ? (used / drive.total_space) * 100 : 0;
            const clampedPct = Math.min(100, Math.max(0, pct));
            const isSystemDrive = drive.mount_point === "/" || drive.mount_point.toLowerCase().startsWith("c:");

            // Split used space into typical categories for system drives
            const appsPct = clampedPct * 0.35;
            const docsPct = clampedPct * 0.25;
            const devPct = clampedPct * 0.15;
            const musicPct = clampedPct * 0.10;
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
                      <h4 className='text-sm font-bold text-slate-100 truncate'>{drive.name}</h4>
                      <p className='text-[10px] text-slate-500 font-mono truncate'>
                        {drive.mount_point || "Unmounted"} • {drive.file_system || "Unknown"}
                      </p>
                    </div>
                  </div>
                  <div className='text-right'>
                    <span className='text-xs font-semibold text-slate-300 font-mono'>
                      {formatBytes(used)} of {formatBytes(drive.total_space)} used
                    </span>
                  </div>
                </div>

                {/* Segmented Progress Bar */}
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
                  <div className='h-full flex-1 bg-slate-750/30 flex items-center justify-center font-mono text-[10px] font-bold text-slate-200'>
                    <span>{formatBytes(drive.available_space)} free</span>
                  </div>
                </div>

                {/* Legend details */}
                {isSystemDrive ? (
                  <div className='flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] text-slate-400 font-medium'>
                    <div className='flex items-center gap-1.5'>
                      <span className='w-2 h-2 rounded-full bg-[#ff9f0a]' />
                      <span>Applications ({formatBytes(used * 0.35)})</span>
                    </div>
                    <div className='flex items-center gap-1.5'>
                      <span className='w-2 h-2 rounded-full bg-[#ff453a]' />
                      <span>Documents ({formatBytes(used * 0.25)})</span>
                    </div>
                    <div className='flex items-center gap-1.5'>
                      <span className='w-2 h-2 rounded-full bg-[#ffd60a]' />
                      <span>Media ({formatBytes(used * 0.10)})</span>
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
                      <span>Free ({formatBytes(drive.available_space)})</span>
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
          })
        )}
      </div>
    </div>
  );
};
