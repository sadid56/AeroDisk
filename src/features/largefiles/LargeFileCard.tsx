import React from "react";
import { File } from "lucide-react";
import { formatBytes } from "../../utils/formatters";
import { LargeFile } from "../../types";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";

interface LargeFileCardProps {
  file: LargeFile;
  onDeleteClick: (path: string) => void;
}

export const LargeFileCard: React.FC<LargeFileCardProps> = ({
  file,
  onDeleteClick,
}) => {
  return (
    <Card
      variant='default'
      padding='sm'
      className='flex items-center justify-between gap-4 transition-all duration-150'
    >
      <div className='flex items-center gap-3 min-w-0'>
        <div className='w-10 h-10 rounded-lg bg-slate-500/10 border border-slate-500/10 text-slate-400 flex items-center justify-center shrink-0'>
          <File className='w-5 h-5' />
        </div>
        <div className='min-w-0'>
          <h4 className='text-sm font-bold text-slate-100 truncate'>{file.name}</h4>
          <p className='text-[10px] text-slate-500 font-mono truncate'>{file.path}</p>
        </div>
      </div>
      <div className='flex items-center gap-6 shrink-0'>
        <span className='px-2 py-0.5 rounded bg-slate-800/20 border border-surface-border text-[9px] font-bold text-slate-400 uppercase font-mono'>
          {file.file_type}
        </span>
        <span className='text-sm font-bold text-slate-100 font-mono'>{formatBytes(file.size)}</span>
        <Button
          variant='outline'
          onClick={() => onDeleteClick(file.path)}
          className='text-xs h-8 border-rose-500/20 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30'
        >
          Delete
        </Button>
      </div>
    </Card>
  );
};
