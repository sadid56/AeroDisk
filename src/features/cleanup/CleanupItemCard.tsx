import React from "react";
import { formatBytes } from "../../utils/formatters";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { CleanupSuggestion } from "../../types";

interface CleanupItemCardProps {
  item: CleanupSuggestion;
  cleaningId: string | null;
  onOpenDetails: (id: string, title: string) => void;
  onCleanClick: (id: string, title: string) => void;
  getIcon: (id: string) => { icon: React.ComponentType<any>; color: string };
}

export const CleanupItemCard: React.FC<CleanupItemCardProps> = ({
  item,
  cleaningId,
  onOpenDetails,
  onCleanClick,
  getIcon,
}) => {
  const config = getIcon(item.id);
  const Icon = config.icon;

  return (
    <Card
      variant='default'
      padding='sm'
      className='flex items-center justify-between gap-4 hover:border-slate-800 transition-all duration-150'
    >
      <div className='flex items-center gap-3.5 min-w-0'>
        <div className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 ${config.color}`}>
          <Icon className='w-5 h-5' />
        </div>
        <div className='min-w-0 space-y-0.5'>
          <h4 className='text-sm font-bold text-slate-100'>{item.title}</h4>
          <p className='text-xs text-slate-500 truncate max-w-[450px]'>{item.desc}</p>
        </div>
      </div>

      <div className='flex items-center gap-6 shrink-0'>
        <span className='text-sm font-bold text-slate-100 font-mono'>{formatBytes(item.size)}</span>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            onClick={() => onOpenDetails(item.id, item.title)}
            className='text-xs h-8 border-slate-800 hover:bg-slate-900/60 hover:text-slate-100 font-bold'
          >
            Details
          </Button>
          <Button
            variant='outline'
            disabled={cleaningId !== null}
            onClick={() => onCleanClick(item.id, item.title)}
            className='text-xs h-8 border-rose-500/20 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 font-bold'
          >
            Clean Up
          </Button>
        </div>
      </div>
    </Card>
  );
};
