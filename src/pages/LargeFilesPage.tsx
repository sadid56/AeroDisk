import React, { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { LargeFile } from "../types";
import { invoke } from "@tauri-apps/api/core";
import { showToast } from "../providers/ToastProvider";
import { AlertModal } from "../components/ui/AlertModal";
import { LargeFileCard } from "../features/largefiles/LargeFileCard";

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
  const [localLargeFiles, setLocalLargeFiles] = useState<LargeFile[]>(largeFiles);

  useEffect(() => {
    setLocalLargeFiles(largeFiles);
  }, [largeFiles]);

  const handleDeleteClick = (path: string) => {
    setDeletingPath(path);
  };

  const handleConfirmDelete = async () => {
    if (!deletingPath) return;
    const targetPath = deletingPath;
    
    // Optimistically update frontend state
    setLocalLargeFiles((prev) => prev.filter((file) => file.path !== targetPath));
    setDeletingPath(null); // Close modal instantly

    try {
      await invoke("delete_item_permanently", { targetPath: targetPath });
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
      onRefresh(); // Restore list if delete failed
    }
  };

  const handleCancelDelete = () => {
    setDeletingPath(null);
  };

  return (
    <div className='flex-1 overflow-y-auto p-6 space-y-6 select-none scrollbar-none animate-in fade-in duration-300'>
      <div className='flex items-center justify-between border-b border-surface-border pb-4'>
        <div>
          <h2 className='text-lg font-bold text-slate-100'>Large Files</h2>
          <p className='text-xs text-slate-500'>Find and manage large files occupying significant storage capacity.</p>
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : localLargeFiles.length === 0 ? (
        <EmptyState message='No large files found on your system.' />
      ) : (
        <div className='space-y-4'>
          {localLargeFiles.map((file, idx) => (
            <LargeFileCard
              key={idx}
              file={file}
              onDeleteClick={handleDeleteClick}
            />
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
        isLoading={false}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
};
