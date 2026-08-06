import React, { useState } from "react";
import { File, AlertCircle } from "lucide-react";
import { formatBytes } from "../utils/formatters";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { LargeFile } from "../types";
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

interface LargeFilesPageProps {
  largeFiles: LargeFile[];
  loading: boolean;
  onRefresh: () => void;
}

export const LargeFilesPage: React.FC<LargeFilesPageProps> = ({ largeFiles, loading, onRefresh }) => {
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
        message: "File Deleted",
        description: "The file was successfully removed permanently.",
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
          <h2 className='text-lg font-bold text-white'>Large Files</h2>
          <p className='text-xs text-slate-500'>Find and manage large files occupying significant storage capacity.</p>
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : largeFiles.length === 0 ? (
        <EmptyState message='No large files found on your system.' />
      ) : (
        <div className='space-y-4'>
          {largeFiles.map((file, idx) => (
            <Card
              key={idx}
              variant='default'
              padding='sm'
              className='flex items-center justify-between gap-4 hover:border-slate-800 transition-all duration-150'
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
                <span className='px-2 py-0.5 rounded bg-slate-800 border border-surface-border text-[9px] font-bold text-slate-400 uppercase font-mono'>
                  {file.file_type}
                </span>
                <span className='text-sm font-bold text-white font-mono'>{formatBytes(file.size)}</span>
                <Button
                  variant='outline'
                  onClick={() => handleDeleteClick(file.path)}
                  className='text-xs h-8 border-rose-500/20 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30'
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <AlertModal
        isOpen={Boolean(deletingPath)}
        title='Delete File Permanently?'
        subtitle={deletingPath ? deletingPath.substring(deletingPath.lastIndexOf("/") + 1) : ""}
        message='This will permanently delete this file from your disk. This action cannot be undone.'
        confirmLabel='Delete Permanently'
        cancelLabel='Cancel'
        variant='danger'
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
};
