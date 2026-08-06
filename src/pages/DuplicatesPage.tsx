import React, { useState } from "react";
import { Copy, AlertCircle } from "lucide-react";
import { formatBytes } from "../utils/formatters";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { DuplicateGroup } from "../types";
import { invoke } from "@tauri-apps/api/core";
import { showToast } from "../providers/ToastProvider";
import { AlertModal } from "../components/ui/AlertModal";

const LoadingSkeleton = () => (
  <div className='space-y-4 animate-pulse py-2'>
    <div className='h-14 w-full rounded-xl bg-slate-900/40 border border-surface-border/40' />
    <div className='h-14 w-full rounded-xl bg-slate-900/40 border border-surface-border/40' />
    <div className='h-14 w-full rounded-xl bg-slate-900/40 border border-surface-border/40' />
  </div>
);

const EmptyState = ({ message }: { message: string }) => (
  <div className='rounded-xl border border-dashed border-slate-800 p-12 flex flex-col items-center justify-center gap-2.5 bg-surface/30 select-none'>
    <AlertCircle className='w-7 h-7 text-slate-600' />
    <p className='text-xs font-semibold text-slate-500 text-center'>{message}</p>
  </div>
);

interface DuplicatesPageProps {
  duplicateGroups: DuplicateGroup[];
  loading: boolean;
  onRefresh: () => void;
}

export const DuplicatesPage: React.FC<DuplicatesPageProps> = ({ duplicateGroups, loading, onRefresh }) => {
  const [deletingPath, setDeletingPath] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (path: string) => {
    setDeletingPath(path);
  };

  const handleConfirmDelete = async () => {
    if (!deletingPath) return;
    setIsDeleting(true);
    try {
      await invoke("delete_item_permanently", { targetPath: deletingPath });
      showToast({
        message: "Duplicate Deleted",
        description: "The duplicate file copy was successfully removed permanently.",
        type: "success",
      });
      onRefresh();
    } catch (err: any) {
      showToast({
        message: "Delete Failed",
        description: err?.message || String(err),
        type: "error",
      });
    } finally {
      setIsDeleting(false);
      setDeletingPath(null);
    }
  };

  const handleCancelDelete = () => {
    setDeletingPath(null);
  };

  return (
    <div className='flex-1 overflow-y-auto p-6 space-y-6 select-none scrollbar-none animate-in fade-in duration-300'>
      <div className='flex items-center justify-between border-b border-surface-border pb-4'>
        <div>
          <h2 className='text-lg font-bold text-white'>Duplicate Files</h2>
          <p className='text-xs text-slate-500'>Locate identical copies of files and directories to free up wasted space.</p>
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : duplicateGroups.length === 0 ? (
        <EmptyState message='No duplicate files detected in your main directories.' />
      ) : (
        <div className='space-y-6'>
          {duplicateGroups.map((group, idx) => (
            <Card key={idx} variant='default' padding='md' className='space-y-4 hover:border-slate-800 transition-all duration-150'>
              <div className='flex items-center justify-between border-b border-surface-border/40 pb-3'>
                <div className='flex items-center gap-3 min-w-0'>
                  <div className='w-9 h-9 rounded-lg bg-slate-500/10 border border-slate-500/10 text-slate-400 flex items-center justify-center shrink-0'>
                    <Copy className='w-4.5 h-4.5' />
                  </div>
                  <div className='min-w-0'>
                    <h4 className='text-sm font-bold text-white truncate'>{group.name}</h4>
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
                        onClick={() => handleDeleteClick(path)}
                        className=' h-5 px-2 border-rose-500/25 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/35 rounded'
                      >
                        Delete Copy
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      <AlertModal
        isOpen={Boolean(deletingPath)}
        title='Delete Duplicate Copy?'
        subtitle={deletingPath ? deletingPath.substring(deletingPath.lastIndexOf("/") + 1) : ""}
        message='This will permanently delete this duplicate copy from your disk. The other copies will remain intact.'
        confirmLabel='Delete Copy'
        cancelLabel='Cancel'
        variant='danger'
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
};
