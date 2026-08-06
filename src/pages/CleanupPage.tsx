import React, { useState } from "react";
import { Trash2, HardDrive, AlertCircle, Sparkles, Folder, File } from "lucide-react";
import { formatBytes } from "../utils/formatters";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { CleanupSuggestion, DirectoryEntry } from "../types";
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

interface CleanupPageProps {
  cleanupSuggestions: CleanupSuggestion[];
  loading: boolean;
  onRefresh: () => void;
}

export const CleanupPage: React.FC<CleanupPageProps> = ({ cleanupSuggestions, loading, onRefresh }) => {
  const [cleaningId, setCleaningId] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<{ id: string; title: string } | null>(null);
  const [detailsTarget, setDetailsTarget] = useState<{ id: string; title: string } | null>(null);
  const [detailsList, setDetailsList] = useState<DirectoryEntry[]>([]);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);

  const handleCleanup = async (id: string, title: string) => {
    setCleaningId(id);
    try {
      await invoke("execute_system_cleanup", { id });
      showToast({
        message: `Successfully emptied the contents of ${title}.`,
        type: "success",
      });
      onRefresh();
      setConfirmTarget(null);
    } catch (err) {
      console.error(err);
      showToast({
        message: `Failed to clean up ${title}.`,
        type: "error",
      });
      setConfirmTarget(null);
    } finally {
      setCleaningId(null);
    }
  };

  const handleOpenDetails = async (id: string, title: string) => {
    setDetailsTarget({ id, title });
    setLoadingDetails(true);
    try {
      const entries = await invoke<DirectoryEntry[]>("fetch_cleanup_details", { id });
      setDetailsList(entries || []);
    } catch (err) {
      console.error("Failed to fetch cleanup details:", err);
      showToast({
        message: "Failed to read directory details.",
        type: "error",
      });
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleIndividualDelete = async (path: string, name: string) => {
    try {
      await invoke("delete_item_permanently", { targetPath: path });
      showToast({
        message: `Successfully deleted ${name}.`,
        type: "success",
      });
      setDetailsList((prev) => prev.filter((item) => item.path !== path));
      onRefresh();
    } catch (err) {
      console.error(err);
      showToast({
        message: `Failed to delete ${name}: ${err}`,
        type: "error",
      });
    }
  };

  const getIcon = (id: string) => {
    switch (id) {
      case "trash":
        return { icon: Trash2, color: "text-slate-400 border-slate-500/10 bg-slate-500/10" };
      case "caches":
        return { icon: Sparkles, color: "text-slate-400 border-slate-500/10 bg-slate-500/10" };
      case "dev_caches":
        return { icon: HardDrive, color: "text-slate-400 border-slate-500/10 bg-slate-500/10" };
      default:
        return { icon: AlertCircle, color: "text-slate-400 border-slate-500/10 bg-slate-500/10" };
    }
  };

  return (
    <div className='flex-1 overflow-y-auto p-6 space-y-6 select-none scrollbar-none animate-in fade-in duration-300'>
      <div className='flex items-center justify-between border-b border-surface-border pb-4'>
        <div>
          <h2 className='text-lg font-bold text-white'>Cleanup Suggestions</h2>
          <p className='text-xs text-slate-500'>Remove unneeded files, system cache, or empty the trash bin instantly.</p>
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : cleanupSuggestions.length === 0 ? (
        <EmptyState message='No cleanup recommendations at this time.' />
      ) : (
        <div className='space-y-4'>
          {cleanupSuggestions.map((item, idx) => {
            const config = getIcon(item.id);
            const Icon = config.icon;
            return (
              <Card
                key={idx}
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
                  <span className='text-sm font-bold text-white font-mono'>{formatBytes(item.size)}</span>
                  <div className='flex items-center gap-2'>
                    <Button
                      variant='outline'
                      onClick={() => handleOpenDetails(item.id, item.title)}
                      className='text-xs h-8 border-slate-800 hover:bg-slate-900/60 hover:text-white font-bold'
                    >
                      Details
                    </Button>
                    <Button
                      variant='outline'
                      disabled={cleaningId !== null}
                      onClick={() => setConfirmTarget({ id: item.id, title: item.title })}
                      className='text-xs h-8 border-rose-500/20 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 font-bold'
                    >
                      Clean Up
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      <AlertModal
        isOpen={Boolean(confirmTarget)}
        title={`Empty ${confirmTarget?.title}?`}
        message={
          <p className='text-xs text-slate-350 leading-relaxed font-semibold'>
            Are you sure you want to clean up the <span className='font-bold text-slate-100'>{confirmTarget?.title}</span>? This action will
            permanently delete these cached or temporary files and cannot be undone.
          </p>
        }
        icon={<Trash2 className='w-5 h-5' />}
        confirmLabel={cleaningId ? "Cleaning..." : "Confirm Clean Up"}
        cancelLabel='Cancel'
        variant='danger'
        isLoading={cleaningId !== null}
        onConfirm={() => {
          if (confirmTarget) {
            handleCleanup(confirmTarget.id, confirmTarget.title);
          }
        }}
        onCancel={() => setConfirmTarget(null)}
      />

      {/* Details Inspector Modal Overlay */}
      {detailsTarget && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-150 select-none'>
          <div className='w-full max-w-2xl bg-surface border border-surface-border rounded-2xl shadow-2xl p-6 flex flex-col max-h-[80vh]'>
            {/* Modal Header */}
            <div className='flex items-center justify-between border-b border-surface-border pb-4 shrink-0'>
              <div className='flex items-center gap-3'>
                <div className='w-9 h-9 rounded-lg bg-slate-500/10 border border-slate-500/10 text-slate-400 flex items-center justify-center'>
                  <HardDrive className='w-4.5 h-4.5' />
                </div>
                <div>
                  <h3 className='text-sm font-bold text-slate-100'>{detailsTarget.title} Contents</h3>
                  <p className='text-[10px] text-slate-500 font-medium'>Showing largest files and folders inside that directory.</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setDetailsTarget(null);
                  setDetailsList([]);
                }}
                className='text-[11px] font-bold text-slate-400 hover:text-white bg-slate-900 border border-surface-border hover:border-slate-800 px-3 py-1 rounded-lg transition-colors cursor-pointer'
              >
                Close
              </button>
            </div>

            {/* Modal Body (Scrollable Files List) */}
            <div className='flex-1 overflow-y-auto py-4 space-y-2 scrollbar-none min-h-[250px]'>
              {loadingDetails ? (
                <div className='space-y-2.5 py-2 animate-pulse'>
                  <div className='h-11 w-full rounded-xl bg-slate-900/50' />
                  <div className='h-11 w-full rounded-xl bg-slate-900/50' />
                  <div className='h-11 w-full rounded-xl bg-slate-900/50' />
                </div>
              ) : detailsList.length === 0 ? (
                <div className='text-center py-16 text-slate-500 text-xs font-semibold'>This directory is currently empty.</div>
              ) : (
                detailsList.map((entry, idx) => (
                  <div
                    key={idx}
                    className='flex items-center justify-between p-3 rounded-xl border border-surface-border/60 bg-slate-950/20 hover:border-slate-850 transition-colors gap-4'
                  >
                    <div className='min-w-0 flex-1 flex items-center gap-3'>
                      <div
                        className={`w-8 h-8 rounded-lg border flex items-center justify-center text-slate-400 shrink-0 ${
                          entry.isDirectory
                            ? "bg-slate-900/60 border-slate-800/40 text-sky-400"
                            : "bg-slate-900/20 border-slate-850 text-slate-500"
                        }`}
                      >
                        {entry.isDirectory ? <Folder className='w-4 h-4' /> : <File className='w-4 h-4' />}
                      </div>
                      <div className='min-w-0 flex-1'>
                        <h4 className='text-xs font-bold text-slate-200 truncate' title={entry.name}>
                          {entry.name}
                        </h4>
                        <p className='text-[9px] text-slate-500 font-mono truncate mt-0.5'>{entry.path}</p>
                      </div>
                    </div>

                    <div className='flex items-center gap-4 shrink-0'>
                      <span className='text-xs font-bold font-mono text-slate-300'>{formatBytes(entry.size)}</span>
                      <Button
                        variant='ghost'
                        size='icon-sm'
                        onClick={() => handleIndividualDelete(entry.path, entry.name)}
                        className='text-slate-500 hover:text-rose-400 border border-transparent hover:border-rose-500/10 hover:bg-rose-500/5 rounded-lg'
                        title='Delete file permanently'
                      >
                        <Trash2 className='w-3.5 h-3.5' />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className='border-t border-surface-border pt-4 flex items-center justify-between shrink-0'>
              <span className='text-[10px] text-slate-500 font-semibold font-mono'>
                {detailsList.length > 0 ? `${detailsList.length} items cataloged` : "Empty directory"}
              </span>
              <Button
                variant='danger'
                disabled={detailsList.length === 0 || cleaningId !== null}
                onClick={() => handleCleanup(detailsTarget.id, detailsTarget.title)}
                size='sm'
              >
                Proceed to Clean Up
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
