import React, { useMemo } from "react";
import { UserFolder } from "../types";
import { FolderCard } from "../features/folders/FolderCard";

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
  const sortedFolders = useMemo(() => {
    return [...folders].sort((a, b) => {
      const aSize = a.size !== undefined && a.size !== null ? a.size : -1;
      const bSize = b.size !== undefined && b.size !== null ? b.size : -1;
      return bSize - aSize;
    });
  }, [folders]);

  return (
    <div className='flex-1 overflow-y-auto p-6 space-y-6 select-none scrollbar-none animate-in fade-in duration-300'>
      <div className='flex items-center justify-between border-b border-surface-border pb-4'>
        <div>
          <h2 className='text-lg font-bold text-slate-100'>System Folders</h2>
          <p className='text-xs text-slate-500'>Quick access shortcuts to analyze major user-profile directories.</p>
        </div>
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'>
        {sortedFolders.map((folder, idx) => (
          <FolderCard
            key={idx}
            folder={folder}
            isScanning={isScanning}
            onScanPath={onScanPath}
          />
        ))}
      </div>
    </div>
  );
};
