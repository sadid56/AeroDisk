import React, { useState, useEffect, useCallback } from 'react';
import { getVersion } from '@tauri-apps/api/app';
import { ArrowLeft, RefreshCw, CheckCircle2, History, Trash2, ArrowUpCircle } from 'lucide-react';
import { showToast } from '../providers/ToastProvider';

interface UpdatesPageProps {
  onBack: () => void;
  updater: {
    checking: boolean;
    updateAvailable: boolean;
    updateInfo: { version: string; date?: string; body?: string } | null;
    installing: boolean;
    progressPercent: number;
    checkForUpdates: (isManual: boolean) => Promise<boolean>;
    startUpdate: () => Promise<void>;
  };
}

interface UpdateHistoryItem {
  version: string;
  installedAt: string;
}

export const UpdatesPage: React.FC<UpdatesPageProps> = React.memo(({ onBack, updater }) => {
  const [currentVersion, setCurrentVersion] = useState<string>('2.0.0');
  const [history, setHistory] = useState<UpdateHistoryItem[]>([]);

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const ver = await getVersion();
        setCurrentVersion(ver);
      } catch (err) {
        console.warn('Failed to fetch app version from Tauri:', err);
      }
    };
    fetchVersion();
    loadHistory();
  }, []);

  const loadHistory = () => {
    const historyJson = localStorage.getItem('aerodisk_update_history') || '[]';
    try {
      setHistory(JSON.parse(historyJson));
    } catch {
      setHistory([]);
    }
  };

  const handleClearHistory = useCallback(() => {
    localStorage.removeItem('aerodisk_update_history');
    setHistory([]);
    showToast({
      message: 'History Cleared',
      description: 'Update installation log history has been deleted.',
      type: 'success',
    });
  }, []);

  const handleDeleteLogItem = useCallback((indexToDelete: number) => {
    setHistory(prev => {
      const updatedHistory = prev.filter((_, idx) => idx !== indexToDelete);
      localStorage.setItem('aerodisk_update_history', JSON.stringify(updatedHistory));
      showToast({
        message: 'Log Item Deleted',
        description: 'Removed update history record.',
        type: 'success',
      });
      return updatedHistory;
    });
  }, []);

  const handleManualCheck = useCallback(async () => {
    await updater.checkForUpdates(true);
  }, [updater]);

  return (
    <div className="flex-1 overflow-y-auto bg-background bg-glow p-6 sm:p-10 select-none">
      <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Navigation Header */}
        <div className="flex items-center justify-between border-b border-surface-border pb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 rounded-lg border border-surface-border bg-surface hover:bg-surface-hover transition-all cursor-pointer text-text-muted hover:text-text-primary"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-xl font-bold">Software Updates</h1>
              <p className="text-[11px] text-text-muted mt-0.5">Manage and check application version controls</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Main updates card */}
          <div className="md:col-span-2 space-y-6">
            <section className="bg-surface/60 border border-surface-border rounded-2xl p-6 space-y-5">
              <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <ArrowUpCircle className="w-4.5 h-4.5 text-accent-purple" />
                <span>System Update Status</span>
              </h2>

              {/* Update Info Display */}
              {updater.updateAvailable && updater.updateInfo ? (
                <div className="p-4 bg-accent-purple/10 border border-accent-purple/30 rounded-xl space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-text-primary">New Release Available (v{updater.updateInfo.version})</h3>
                      <p className="text-[10px] text-text-muted mt-0.5">Released on: {updater.updateInfo.date ? new Date(updater.updateInfo.date).toLocaleDateString() : 'N/A'}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-accent-purple text-white uppercase tracking-wider">New</span>
                  </div>

                  {updater.updateInfo.body && (
                    <div className="text-[11px] text-text-muted bg-background/50 border border-surface-border p-3 rounded-lg max-h-24 overflow-y-auto leading-relaxed whitespace-pre-wrap select-text scrollbar-thin scrollbar-thumb-surface-border">
                      {updater.updateInfo.body}
                    </div>
                  )}

                  {updater.installing ? (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-accent-purple animate-pulse">Installing Update...</span>
                        <span className="text-text-muted">{updater.progressPercent}%</span>
                      </div>
                      <div className="w-full h-2 bg-background border border-surface-border rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-accent-purple to-accent-blue rounded-full transition-all duration-300 shadow-md"
                          style={{ width: `${updater.progressPercent}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={updater.startUpdate}
                      className="w-full py-2.5 rounded-xl text-white font-semibold text-xs bg-gradient-to-r from-accent-purple to-accent-blue hover:brightness-110 active:scale-95 shadow-md shadow-accent-purple/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Update to v{updater.updateInfo.version} Now</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-4 p-4 bg-background/40 border border-surface-border rounded-xl">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 shrink-0" />
                  <div>
                    <h3 className="font-bold text-sm text-text-primary">AeroDisk is Up to Date</h3>
                    <p className="text-[11px] text-text-muted mt-0.5">Current Installed Version: v{currentVersion}</p>
                  </div>
                </div>
              )}

              {/* Manual Trigger Section */}
              <div className="flex items-center justify-between pt-2 border-t border-surface-border/40">
                <div className="text-[11px] text-text-muted">
                  Last checked: {new Date().toLocaleTimeString()}
                </div>
                <button
                  onClick={handleManualCheck}
                  disabled={updater.checking || updater.installing}
                  className="px-4 py-2 rounded-xl border border-surface-border bg-background hover:bg-surface-hover disabled:opacity-50 text-xs font-bold text-text-secondary hover:text-text-primary transition-all cursor-pointer flex items-center gap-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${updater.checking ? 'animate-spin text-accent-purple' : ''}`} />
                  <span>Check for Updates</span>
                </button>
              </div>
            </section>
          </div>

          {/* History Sidebar */}
          <div className="space-y-6">
            <section className="bg-surface/60 border border-surface-border rounded-2xl p-5 space-y-4 h-full flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold text-text-primary flex items-center gap-2">
                    <History className="w-4 h-4 text-accent-blue" />
                    <span>Installation Log</span>
                  </h2>
                  {history.length > 0 && (
                    <button
                      onClick={handleClearHistory}
                      title="Clear installation log history"
                      className="p-1 rounded-lg border border-surface-border text-text-muted hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {history.length > 0 ? (
                  <div className="space-y-2.5 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-surface-border pr-1">
                    {history.map((item, idx) => (
                      <div 
                        key={idx} 
                        className="p-3 bg-background/40 border border-surface-border/80 rounded-xl text-[11px] flex items-center justify-between group"
                      >
                        <div className="space-y-0.5">
                          <span className="font-bold text-text-primary">v{item.version}</span>
                          <p className="text-[9px] text-text-muted">{new Date(item.installedAt).toLocaleString()}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteLogItem(idx)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-text-muted hover:text-red-400 transition-all cursor-pointer"
                          title="Delete this record"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center text-text-muted border border-dashed border-surface-border rounded-xl bg-background/20">
                    <History className="w-8 h-8 opacity-20 mb-2" />
                    <p className="text-[10px] font-medium leading-relaxed px-4">No updates have been installed through the app yet.</p>
                  </div>
                )}
              </div>

              <div className="text-[9px] text-text-muted leading-relaxed pt-4 border-t border-surface-border/30">
                AeroDisk auto-downloads packages securely from official release targets.
              </div>
            </section>
          </div>

        </div>

      </div>
    </div>
  );
});
