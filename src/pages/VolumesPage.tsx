import React from "react";
import { HardDrive, Usb } from "lucide-react";
import { formatBytes } from "../utils/formatters";
import { SystemDrive, FileNode } from "../types";

const getFileExtension = (filename: string): string => {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "";
};

const getCategory = (node: FileNode): "apps" | "docs" | "media" | "dev" | "system" => {
  if (node.isDirectory) return "system";

  const ext = getFileExtension(node.name);
  
  if (["app", "exe", "dmg", "pkg", "msi", "deb", "rpm", "apk", "jar", "appimage"].includes(ext)) {
    return "apps";
  }
  
  if (["pdf", "doc", "docx", "txt", "md", "csv", "xlsx", "xls", "ppt", "pptx", "epub", "pages", "key", "numbers", "odt", "ods", "odp"].includes(ext)) {
    return "docs";
  }
  
  if ([
    "png", "jpg", "jpeg", "webp", "gif", "svg", "ico", "heic", "tiff", "psd", "ai",
    "mp4", "mkv", "mov", "avi", "webm", "flv", "m4v", "3gp",
    "mp3", "wav", "flac", "m4a", "ogg", "aac", "wma"
  ].includes(ext)) {
    return "media";
  }
  
  if ([
    "js", "ts", "tsx", "jsx", "html", "css", "json", "py", "go", "rs", "cpp", "c", "h", "hpp", "java", "sh", "yaml", "yml", "toml", "swift", "kt", "php", "rb", "sql", "cs", "scala", "pl", "pm", "r", "dart"
  ].includes(ext)) {
    return "dev";
  }
  
  return "system";
};

interface VolumesPageProps {
  drives: SystemDrive[];
  isScanning: boolean;
  onScanPath: (path: string) => void;
  flatNodes?: FileNode[];
}

export const VolumesPage: React.FC<VolumesPageProps> = ({
  drives,
  isScanning,
  onScanPath,
  flatNodes = [],
}) => {
  return (
    <div className='flex-1 overflow-y-auto p-6 space-y-6 select-none scrollbar-none animate-in fade-in duration-300'>
      <div className='flex items-center justify-between border-b border-surface-border pb-4'>
        <div>
          <h2 className='text-lg font-bold text-slate-100'>Local Volumes</h2>
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


            // Find if this drive matches the current active scan path
            const scannedRootPath = flatNodes.length > 0 ? flatNodes[0].path : null;

            let isScannedForThisDrive = false;
            if (scannedRootPath) {
              // Find which drive is the longest prefix match for scannedRootPath
              let bestMatchMountPoint = null;
              let longestMatchLen = -1;
              const normRoot = scannedRootPath.toLowerCase().replace(/\\/g, "/");
              for (const d of drives) {
                const normMount = d.mount_point.toLowerCase().replace(/\\/g, "/");
                if (normRoot.startsWith(normMount)) {
                  if (normMount.length > longestMatchLen) {
                    longestMatchLen = normMount.length;
                    bestMatchMountPoint = d.mount_point;
                  }
                }
              }
              isScannedForThisDrive = bestMatchMountPoint === drive.mount_point;
            }

            let appsSize = 0;
            let docsSize = 0;
            let mediaSize = 0;
            let devSize = 0;
            let systemSize = 0;

            if (isScannedForThisDrive && flatNodes.length > 0) {
              let scannedFilesTotal = 0;
              for (const node of flatNodes) {
                if (node.isDirectory) continue;
                const cat = getCategory(node);
                if (cat === "apps") appsSize += node.size;
                else if (cat === "docs") docsSize += node.size;
                else if (cat === "media") mediaSize += node.size;
                else if (cat === "dev") devSize += node.size;
                else if (cat === "system") systemSize += node.size;
                scannedFilesTotal += node.size;
              }
              const actualUsed = drive.total_space - drive.available_space;
              const unscannedUsed = Math.max(0, actualUsed - scannedFilesTotal);
              systemSize += unscannedUsed;
            } else {
              const actualUsed = drive.total_space - drive.available_space;
              appsSize = actualUsed * 0.35;
              docsSize = actualUsed * 0.25;
              mediaSize = actualUsed * 0.10;
              devSize = actualUsed * 0.15;
              systemSize = actualUsed * 0.15;
            }

            const appsPct = drive.total_space > 0 ? (appsSize / drive.total_space) * 100 : 0;
            const docsPct = drive.total_space > 0 ? (docsSize / drive.total_space) * 100 : 0;
            const mediaPct = drive.total_space > 0 ? (mediaSize / drive.total_space) * 100 : 0;
            const devPct = drive.total_space > 0 ? (devSize / drive.total_space) * 100 : 0;
            const systemPct = drive.total_space > 0 ? (systemSize / drive.total_space) * 100 : 0;

            const shouldShowSegments = isScannedForThisDrive;

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
                  {shouldShowSegments ? (
                    <>
                      <div className='h-full bg-[#ff453a] transition-all duration-300' style={{ width: `${docsPct}%` }} />
                      <div className='h-full bg-[#ff9f0a] transition-all duration-300' style={{ width: `${appsPct}%` }} />
                      <div className='h-full bg-[#ffd60a] transition-all duration-300' style={{ width: `${mediaPct}%` }} />
                      <div className='h-full bg-[#30d158] transition-all duration-300' style={{ width: `${devPct}%` }} />
                      <div className='h-full bg-[#8e8e93] transition-all duration-300' style={{ width: `${systemPct}%` }} />
                    </>
                  ) : (
                    <div className='h-full bg-indigo-500/85 transition-all duration-300' style={{ width: `${clampedPct}%` }} />
                  )}
                  {/* Floating centered text with high readability shadow */}
                  <div 
                    className='absolute inset-0 flex items-center justify-center font-mono text-[10px] font-bold text-white pointer-events-none'
                    style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}
                  >
                    <span>{formatBytes(drive.available_space)} free</span>
                  </div>
                </div>

                {/* Legend details */}
                {shouldShowSegments ? (
                  <div className='flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] text-slate-400 font-medium'>
                    <div className='flex items-center gap-1.5'>
                      <span className='w-2 h-2 rounded-full bg-[#ff9f0a]' />
                      <span>Applications ({formatBytes(appsSize)})</span>
                    </div>
                    <div className='flex items-center gap-1.5'>
                      <span className='w-2 h-2 rounded-full bg-[#ff453a]' />
                      <span>Documents ({formatBytes(docsSize)})</span>
                    </div>
                    <div className='flex items-center gap-1.5'>
                      <span className='w-2 h-2 rounded-full bg-[#ffd60a]' />
                      <span>Media ({formatBytes(mediaSize)})</span>
                    </div>
                    <div className='flex items-center gap-1.5'>
                      <span className='w-2 h-2 rounded-full bg-[#30d158]' />
                      <span>Developer ({formatBytes(devSize)})</span>
                    </div>
                    <div className='flex items-center gap-1.5'>
                      <span className='w-2 h-2 rounded-full bg-[#8e8e93]' />
                      <span>System Data ({formatBytes(systemSize)})</span>
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
