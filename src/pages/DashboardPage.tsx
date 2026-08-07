import React from "react";
import { Activity, HardDrive, LayoutGrid, ExternalLink } from "lucide-react";
import { formatBytes } from "../utils/formatters";
import { SystemDrive, UserFolder } from "../types";
import { Card } from "../components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getFolderTheme } from "../utils/folderThemes";
import { Skeleton } from "../components/ui/Skeleton";

interface DashboardPageProps {
  drives: SystemDrive[];
  folders: UserFolder[];
  isLoading?: boolean;
  onScanPath: (path: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ drives, folders, isLoading, onScanPath, onNavigateTab }) => {

  if (isLoading) {
    return (
      <div className='flex-1 overflow-y-auto p-6 space-y-6 select-none scrollbar-none animate-in fade-in duration-300'>
        {/* Top Stat Cards Skeleton */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-5'>
          {Array.from({ length: 3 }).map((_, idx) => (
            <Card key={idx} padding='sm' className='flex items-center justify-between'>
              <div className='flex flex-col gap-2 flex-1 pr-4'>
                <Skeleton width={80} height={10} rounded='sm' />
                <Skeleton width={120} height={20} rounded='sm' />
                <Skeleton width={60} height={10} rounded='sm' />
              </div>
              <Skeleton width={40} height={40} rounded='full' />
            </Card>
          ))}
        </div>

        {/* Main Drive Overview Card Skeleton */}
        <Card padding='lg' className='flex flex-col md:flex-row items-center gap-6 justify-between'>
          <div className='flex items-center gap-5 flex-1 w-full'>
            <Skeleton width={56} height={72} rounded='lg' className='shrink-0' />
            <div className='flex-1 space-y-3.5'>
              <div className='flex items-center gap-3'>
                <Skeleton width={120} height={16} rounded='sm' />
                <Skeleton width={60} height={14} rounded='sm' />
              </div>
              <Skeleton height={20} rounded='md' className='w-full' />
              <div className='flex gap-4'>
                <Skeleton width={140} height={10} rounded='sm' />
                <Skeleton width={100} height={10} rounded='sm' />
              </div>
            </div>
          </div>
          <Skeleton width={120} height={36} rounded='md' className='shrink-0' />
        </Card>

        {/* Frequent Folders Skeleton */}
        <Card padding='md' className='flex flex-col justify-between min-h-[340px]'>
          <div className='flex items-center justify-between mb-4'>
            <Skeleton width={110} height={12} rounded='sm' />
            <Skeleton width={50} height={10} rounded='sm' />
          </div>

          <div className='grid grid-cols-2 md:grid-cols-4 gap-3 flex-1 py-1'>
            {Array.from({ length: 6 }).map((_, idx) => (
              <Card key={idx} padding='sm' className='flex flex-col justify-between w-full h-[105px]'>
                <Skeleton width={32} height={32} rounded='lg' />
                <div className='space-y-2 mt-auto'>
                  <Skeleton width={80} height={12} rounded='sm' />
                  <Skeleton width={40} height={10} rounded='sm' />
                </div>
              </Card>
            ))}
          </div>
        </Card>
      </div>
    );
  }


  // Find system drive
  const systemDrive = drives.find((d) => d.mount_point === "/" || d.mount_point.toLowerCase().startsWith("c:")) || drives[0];

  const total = systemDrive?.total_space;
  const available = systemDrive?.available_space;
  const used = total - available;
  const usedPct = total > 0 ? (used / total) * 100 : 0;
  const availablePct = total > 0 ? (available / total) * 100 : 0;

  // Calculate actual category sizes dynamically from user folders list
  const getFolderSize = (folderName: string) => {
    return folders.find((f) => f.name.toLowerCase() === folderName.toLowerCase())?.size || 0;
  };

  const appSize = getFolderSize("applications");
  const docSize = getFolderSize("documents");
  const mediaSize = getFolderSize("pictures") + getFolderSize("movies") + getFolderSize("music");
  const devSize = getFolderSize("developer"); // 0 if not found
  const sysDataSize = Math.max(0, used - (appSize + docSize + mediaSize + devSize));

  // Percentages relative to total size
  const appPct = total > 0 ? (appSize / total) * 100 : 0;
  const docPct = total > 0 ? (docSize / total) * 100 : 0;
  const mediaPct = total > 0 ? (mediaSize / total) * 100 : 0;
  const devPct = total > 0 ? (devSize / total) * 100 : 0;
  const sysDataPct = total > 0 ? (sysDataSize / total) * 100 : 0;



  // Find the folder with the maximum size
  const largestFolder = React.useMemo(() => {
    if (!folders || folders.length === 0) return null;
    const validFolders = folders.filter((f) => f.size !== undefined);
    if (validFolders.length === 0) return null;
    return validFolders.reduce((max, current) => {
      return (current.size || 0) > (max.size || 0) ? current : max;
    }, validFolders[0]);
  }, [folders]);

  const largestCategoryName = largestFolder ? largestFolder.name : "None";
  const largestCategorySize = largestFolder ? (largestFolder.size || 0) : 0;

  // Dynamic top statistic cards definition
  const statCards = [
    {
      title: "Total Used",
      value: formatBytes(used),
      subValue: (
        <div className='flex items-center gap-1.5 text-[10px] text-slate-500 font-medium'>
          <span>of {formatBytes(total)}</span>
          <span className='px-1.5 py-0.2 rounded bg-slate-500/10 border border-slate-500/25 text-slate-400 font-bold font-mono'>
            {usedPct.toFixed(0)}%
          </span>
        </div>
      ),
      icon: Activity,
      color: "text-slate-400 border-slate-500/10 bg-slate-500/10",
      valueClass: "font-mono",
    },
    {
      title: "Free Space",
      value: formatBytes(available),
      subValue: <span className='text-[10px] text-slate-500 font-medium'>{availablePct.toFixed(1)}% available</span>,
      icon: HardDrive,
      color: "text-slate-400 border-slate-500/10 bg-slate-500/10",
      valueClass: "font-mono",
    },
    {
      title: "Largest Category",
      value: largestCategoryName,
      subValue: <span className='text-[10px] text-slate-500 font-mono font-medium'>{formatBytes(largestCategorySize)}</span>,
      icon: LayoutGrid,
      color: "text-slate-400 border-slate-500/10 bg-slate-500/10",
      valueClass: "truncate max-w-[160px]",
    },
  ];

  return (
    <div className='flex-1 overflow-y-auto p-6 space-y-6 select-none scrollbar-none animate-in fade-in duration-300'>
      {/* Top Stat Cards Grid */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-5'>
        {statCards.map((card, idx) => {
          const CardIcon = card.icon;
          return (
            <Card
              key={idx}
              variant='default'
              padding='sm'
              className='flex items-center justify-between hover:border-slate-800 transition-all duration-200'
            >
              <div className='flex flex-col gap-1.5'>
                <span className='text-[10px] font-bold uppercase tracking-wider text-slate-400'>{card.title}</span>
                <div className={`text-xl font-bold text-white leading-none ${card.valueClass || ""}`}>{card.value}</div>
                {card.subValue}
              </div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-inner shrink-0 ${card.color}`}>
                <CardIcon className='w-5 h-5' />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Main Drive Overview Card */}
      {systemDrive && (
        <Card
          variant='default'
          padding='lg'
          className='flex flex-col md:flex-row items-start md:items-center gap-6 justify-between hover:border-slate-800 transition-all duration-200'
        >
          <div className='flex items-center gap-5 flex-1 min-w-0'>
            {/* System drive hardware representation icon */}
            <div className='relative w-14 h-18 bg-gradient-to-b from-slate-700 to-slate-900 border border-slate-600 rounded-lg flex flex-col justify-between p-1.5 shadow-lg shrink-0'>
              <div className='w-full h-8 bg-slate-800 rounded border border-slate-700/50 flex flex-col justify-between p-0.5'>
                <div className='w-3 h-0.5 bg-slate-500 rounded-full mx-auto' />
                <div className='w-full h-2 bg-slate-900 rounded-sm' />
              </div>
              <div className='flex items-center justify-between text-[6px] text-slate-500 font-mono'>
                <div className='flex gap-0.5'>
                  <div className='w-1 h-1 rounded-full bg-emerald-500 animate-pulse' />
                  <div className='w-1 h-1 rounded-full bg-slate-600' />
                </div>
                <span>SSD</span>
              </div>
            </div>

            <div className='flex-1 min-w-0 space-y-3.5'>
              <div className='flex items-center gap-3'>
                <h3 className='text-base font-bold text-white truncate'>{systemDrive.name}</h3>
                <span className='text-[10px] text-slate-400 font-mono bg-slate-800/80 border border-surface-border px-1.5 py-0.2 rounded'>
                  {systemDrive.file_system} Volume
                </span>
              </div>

              {/* Horizontal Segmented Progress Bar */}
              <div className='h-5 w-full bg-slate-800/60 border border-slate-700/50 rounded-md overflow-hidden flex relative items-center'>
                <div className='h-full bg-[#ff9f0a] transition-all duration-300' style={{ width: `${appPct}%` }} />
                <div className='h-full bg-[#ff453a] transition-all duration-300' style={{ width: `${docPct}%` }} />
                <div className='h-full bg-[#ffd60a] transition-all duration-300' style={{ width: `${mediaPct}%` }} />
                <div className='h-full bg-[#30d158] transition-all duration-300' style={{ width: `${devPct}%` }} />
                <div className='h-full bg-[#8e8e93] transition-all duration-300' style={{ width: `${sysDataPct}%` }} />
                {/* Free space segment */}
                <div className='h-full flex-1 bg-slate-750/30 flex items-center justify-end pr-3 font-mono text-[9px] font-bold text-slate-400'>
                  <span>{formatBytes(available)} free</span>
                </div>
              </div>

              {/* Legend dots */}
              <div className='flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] text-slate-400 font-medium'>
                <div className='flex items-center gap-1.5'>
                  <span className='w-2 h-2 rounded-full bg-[#8e8e93]' />
                  <span>System Data ({formatBytes(sysDataSize)})</span>
                </div>
                <div className='flex items-center gap-1.5'>
                  <span className='w-2 h-2 rounded-full bg-slate-700' />
                  <span>Free Space ({formatBytes(available)})</span>
                </div>
              </div>
            </div>
          </div>

          <Button
            className='mt-2'
            onClick={() => onScanPath(systemDrive.mount_point)}
            variant='outline'
            leftIcon={<ExternalLink className='w-3.5 h-3.5' />}
          >
            View Volume
          </Button>
        </Card>
      )}

      {/* Bottom Grid: Frequent Folders, Recent Scan */}
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-5'>
        {/* Widget 2: Frequent Folders */}
        <Card
          variant='default'
          padding='md'
          className='lg:col-span-12 flex flex-col justify-between min-h-[340px] hover:border-slate-800 transition-all duration-200'
        >
          <div className='flex items-center justify-between mb-2'>
            <h3 className='text-xs font-bold uppercase tracking-wider text-slate-400'>Frequent Folders</h3>
            <button
              onClick={() => onNavigateTab("folders")}
              className='text-[10px] font-bold text-accent-purple hover:underline cursor-pointer'
            >
              View all
            </button>
          </div>

          <div className='grid grid-cols-2 md:grid-cols-4 gap-3 flex-1 py-1'>
            {folders.slice(0, 6).map((folder, index) => {
              const theme = getFolderTheme(folder.name);
              const FolderIcon = theme.icon;

              return (
                <Card
                  key={index}
                  as='button'
                  onClick={() => onScanPath(folder.path)}
                  variant='interactive'
                  padding='sm'
                  className='group flex flex-col justify-between w-full text-left'
                >
                  <div
                    className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${theme.color} group-hover:scale-105 transition-transform duration-200`}
                  >
                    <FolderIcon className='w-4.5 h-4.5' />
                  </div>
                  <div className='mt-2.5 space-y-0.5'>
                    <h4 className='text-xs font-bold text-slate-100 truncate'>{folder.name}</h4>
                    <p className='text-[9px] text-slate-500 font-mono truncate font-semibold'>
                      {folder.size !== undefined && folder.size !== null ? formatBytes(folder.size) : "Access Required"}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
};
