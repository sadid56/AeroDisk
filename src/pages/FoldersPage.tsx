import React from "react";
import { ArrowRight } from "lucide-react";
import { formatBytes } from "../utils/formatters";
import { UserFolder } from "../types";
import { Card } from "../components/ui/Card";
import { getFolderTheme } from "../utils/folderThemes";

interface FoldersPageProps {
  folders: UserFolder[];
  isScanning: boolean;
  onScanPath: (path: string) => void;
}

export const FoldersPage: React.FC<FoldersPageProps> = ({
  folders,
  isScanning,
  onScanPath,
}) => {

  return (
    <div className='flex-1 overflow-y-auto p-6 space-y-6 select-none scrollbar-none animate-in fade-in duration-300'>
      <div className='flex items-center justify-between border-b border-surface-border pb-4'>
        <div>
          <h2 className='text-lg font-bold text-white'>System Folders</h2>
          <p className='text-xs text-slate-500'>Quick access shortcuts to analyze major user-profile directories.</p>
        </div>
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'>
        {folders.map((folder, idx) => {
          const theme = getFolderTheme(folder.name);
          const FolderIcon = theme.Icon;

          return (
            <Card
              key={idx}
              as='button'
              disabled={isScanning}
              onClick={() => !isScanning && onScanPath(folder.path)}
              variant='interactive'
              padding='md'
              className={`group flex items-center justify-between gap-4 w-full ${isScanning ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              <div className='min-w-0 flex-1 flex items-center gap-4'>
                <div
                  className={`w-11 h-11 rounded-lg border flex items-center justify-center shrink-0 ${theme.color} transition-transform duration-200 group-hover:scale-105`}
                >
                  <FolderIcon className='w-5 h-5' />
                </div>
                <div className='min-w-0 flex-1 space-y-0.5'>
                  <div className='flex items-center justify-between gap-2'>
                    <h4 className='text-sm font-bold text-slate-100 truncate'>{folder.name}</h4>
                    {folder.size !== undefined && (
                      <span className='text-[10px] font-bold text-slate-350 font-mono bg-slate-900/60 border border-surface-border px-1.5 py-0.5 rounded shrink-0'>
                        {formatBytes(folder.size)}
                      </span>
                    )}
                  </div>
                  <p className='text-[10px] text-slate-500 font-mono truncate'>{folder.path}</p>
                </div>
              </div>

              <ArrowRight className='w-4 h-4 text-slate-600 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-slate-300 shrink-0' />
            </Card>
          );
        })}
      </div>
    </div>
  );
};
