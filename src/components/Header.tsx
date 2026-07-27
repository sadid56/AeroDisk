import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FolderOpen, RefreshCw, Search, Settings, ArrowLeft, FolderPlus, LayoutGrid } from "lucide-react";
import logoUrl from "../assets/favicon.png";

interface HeaderProps {
  onSelectFolder: () => void;
  onCreateFolder?: () => void;
  onDashboard?: () => void;
  onRescan: () => void;
  onOpenSearchModal: () => void;
  isScanning: boolean;
  hasScanData: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onSelectFolder,
  onCreateFolder,
  onDashboard,
  onRescan,
  onOpenSearchModal,
  isScanning,
  hasScanData,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isSettings = location.pathname === "/settings";

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        if (!isSettings) {
          onOpenSearchModal();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onOpenSearchModal, isSettings]);

  return (
    <header
      data-tauri-drag-region
      className='h-16 px-6 bg-surface/80 backdrop-blur-xl border-b border-surface-border flex items-center justify-between z-20 shrink-0 select-none'
    >
      <div className='flex items-center gap-3' data-tauri-drag-region>
        {/* Clickable Logo & Title for Quick Navigation */}
        <button
          onClick={() => {
            navigate("/");
            if (onDashboard) onDashboard();
          }}
          title='Go to Main Storage Dashboard'
          className='flex items-center gap-3 hover:opacity-90 transition-opacity cursor-pointer text-left'
        >
          <img src={logoUrl} alt='AeroDisk Logo' className='w-9 h-9 rounded-xl border border-surface-border shadow-md object-cover' />
          <h1 className='font-bold text-base tracking-tight font-sans'>AeroDisk</h1>
        </button>
      </div>

      <div className='flex items-center gap-3'>
        {isSettings ? (
          <button
            onClick={() => navigate("/")}
            className='px-4 py-2 rounded-lg bg-accent-purple/20 border border-accent-purple/40 text-accent-purple hover:bg-accent-purple/30 transition-all cursor-pointer font-medium text-xs flex items-center gap-2'
          >
            <ArrowLeft className='w-4 h-4' />
            <span>Return to Analyzer</span>
          </button>
        ) : (
          <>
            {hasScanData && (
              <button
                onClick={onOpenSearchModal}
                className='w-56 px-3 py-1.5 bg-background/60 border border-surface-border rounded-lg text-xs opacity-75 flex items-center justify-between hover:border-accent-purple/50 transition-all cursor-pointer'
              >
                <span className='flex items-center gap-2'>
                  <Search className='w-3.5 h-3.5 text-accent-purple' />
                  <span>Search items...</span>
                </span>
                <kbd className='px-1.5 py-0.5 rounded text-[10px] font-mono bg-surface border border-surface-border'>Ctrl+K</kbd>
              </button>
            )}

            <button
              onClick={() => {
                navigate("/");
                if (onDashboard) onDashboard();
              }}
              title='Main Storage Dashboard'
              className='p-2 rounded-lg bg-surface border border-surface-border hover:bg-surface-hover transition-all cursor-pointer text-slate-200 hover:text-white'
            >
              <LayoutGrid className='w-4 h-4' />
            </button>

            {hasScanData && (
              <>
                <button
                  onClick={onRescan}
                  disabled={isScanning}
                  title='Rescan Directory'
                  className='p-2 rounded-lg bg-surface border border-surface-border hover:bg-surface-hover disabled:opacity-50 transition-all cursor-pointer text-slate-200 hover:text-white'
                >
                  <RefreshCw className={`w-4 h-4 ${isScanning ? "animate-spin text-accent-purple" : ""}`} />
                </button>

                {onCreateFolder && (
                  <button
                    onClick={onCreateFolder}
                    disabled={isScanning}
                    title='New Folder'
                    className='p-2 rounded-lg bg-surface border border-surface-border hover:bg-surface-hover disabled:opacity-50 transition-all cursor-pointer text-accent-purple'
                  >
                    <FolderPlus className='w-4 h-4' />
                  </button>
                )}
              </>
            )}

            <button
              onClick={() => navigate("/settings")}
              title='Application Settings'
              className='p-2 rounded-lg bg-surface border border-surface-border hover:bg-surface-hover transition-all cursor-pointer text-slate-200 hover:text-white'
            >
              <Settings className='w-4 h-4' />
            </button>

            <button
              onClick={onSelectFolder}
              disabled={isScanning}
              className='px-4 py-2 rounded-lg bg-gradient-to-r from-accent-purple to-accent-blue text-white font-medium text-xs shadow-md shadow-accent-purple/20 hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all cursor-pointer flex items-center gap-2'
            >
              <FolderOpen className='w-4 h-4' />
              <span>Choose Directory</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
};
