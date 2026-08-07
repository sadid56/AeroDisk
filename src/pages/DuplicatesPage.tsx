import React, { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { DuplicateGroup } from "../types";
import { invoke } from "@tauri-apps/api/core";
import { showToast } from "../providers/ToastProvider";
import { AlertModal } from "../components/ui/AlertModal";
import { DuplicateGroupCard } from "../features/duplicates/DuplicateGroupCard";

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
  const [localDuplicateGroups, setLocalDuplicateGroups] = useState<DuplicateGroup[]>(duplicateGroups);

  useEffect(() => {
    setLocalDuplicateGroups(duplicateGroups);
  }, [duplicateGroups]);

  const handleDeleteClick = (path: string) => {
    setDeletingPath(path);
  };

  const handleConfirmDelete = async () => {
    if (!deletingPath) return;
    const targetPath = deletingPath;

    // Optimistically update frontend state
    setLocalDuplicateGroups((prev) =>
      prev
        .map((group) => {
          const filteredPaths = group.paths.filter((p) => p !== targetPath);
          return {
            ...group,
            paths: filteredPaths,
            count: filteredPaths.length,
            total_waste: group.size * Math.max(0, filteredPaths.length - 1),
          };
        })
        .filter((group) => group.paths.length > 1)
    );
    setDeletingPath(null); // Close modal instantly

    try {
      await invoke("delete_item_permanently", { targetPath: targetPath });
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
          <h2 className='text-lg font-bold text-slate-100'>Duplicate Files</h2>
          <p className='text-xs text-slate-500'>Locate identical copies of files and directories to free up wasted space.</p>
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : localDuplicateGroups.length === 0 ? (
        <EmptyState message='No duplicate files detected in your main directories.' />
      ) : (
        <div className='space-y-6'>
          {localDuplicateGroups.map((group, idx) => (
            <DuplicateGroupCard
              key={idx}
              group={group}
              onDeleteClick={handleDeleteClick}
            />
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
        isLoading={false}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
};
