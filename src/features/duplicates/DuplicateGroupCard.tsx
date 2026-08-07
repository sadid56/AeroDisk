import React from "react";
import { Copy } from "lucide-react";
import { formatBytes } from "../../utils/formatters";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { DuplicateGroup } from "../../types";

interface DuplicateGroupCardProps {
  group: DuplicateGroup;
  onDeleteClick: (path: string) => void;
}

export const DuplicateGroupCard: React.FC<DuplicateGroupCardProps> = ({
  group,
  onDeleteClick,
}) => {
  return (
    <Card variant='default' padding='md' className='space-y-4 hover:border-slate-800 transition-all duration-150'>
      <div className='flex items-center justify-between border-b border-surface-border/40 pb-3'>
        <div className='flex items-center gap-3 min-w-0'>
          <div className='w-9 h-9 rounded-lg bg-slate-500/10 border border-slate-500/10 text-slate-400 flex items-center justify-center shrink-0'>
            <Copy className='w-4.5 h-4.5' />
          </div>
          <div className='min-w-0'>
            <h4 className='text-sm font-bold text-slate-100 truncate'>{group.name}</h4>
            <p className='text-[10px] text-slate-500 font-medium'>
              {group.count} copies found • {formatBytes(group.size)} each
            </p>
          </div>
        </div>
        <div className='text-right shrink-0'>
          <p className='text-xs font-bold text-rose-400 font-mono'>Wasted: {formatBytes(group.total_waste)}</p>
        </div>
      </div>
      <div className='space-y-2'>
        {group.paths.map((path, pIdx) => (
          <div
            key={pIdx}
            className='flex items-center justify-between text-[10px] bg-slate-900/30 p-2 rounded-lg border border-surface-border/40'
          >
            <span className='font-mono text-slate-400 truncate max-w-[500px]'>{path}</span>
            {pIdx === 0 ? (
              <span className='px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'>
                KEEP
              </span>
            ) : (
              <Button
                variant='danger'
                onClick={() => onDeleteClick(path)}
                className='h-5 px-2 border-rose-500/25 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/35 rounded'
              >
                Delete Copy
              </Button>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};
