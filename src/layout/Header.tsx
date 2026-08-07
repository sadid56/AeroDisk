import { Settings, Search, RefreshCw, Folder } from "lucide-react";
import { Button } from "../components/ui/Button";
import { useLocation, useNavigate } from "react-router-dom";
import React, { useEffect } from "react";

interface HeaderProps {
  onSelectFolder: () => void;
  onDashboard?: () => void;
  onOpenSearchModal: () => void;
  isScanning: boolean;
  hasScanData: boolean;
  updateAvailable?: boolean;
  onRefresh?: () => void;
}

export const Header: React.FC<HeaderProps> = React.memo(
  ({ onSelectFolder, onOpenSearchModal, isScanning, hasScanData: _hasScanData, updateAvailable, onRefresh }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const isSettings = location.pathname === "/settings";
    const canSearch = !isSettings;

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "k") {
          e.preventDefault();
          if (canSearch) {
            onOpenSearchModal();
          }
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onOpenSearchModal, canSearch]);

    return (
      <header
        data-tauri-drag-region
        className='h-16 px-6 border-b border-surface-border flex items-center justify-between z-20 shrink-0 select-none shadow-sm'
      >
        {/* Search Trigger */}
        <div className='relative w-80'>
          <button
            onClick={onOpenSearchModal}
            className='w-full bg-slate-950/5 dark:bg-slate-950/40 border border-surface-border hover:bg-slate-950/10 dark:hover:bg-slate-950/50 transition-colors rounded-lg py-1.5 pl-3 pr-3 text-slate-400 text-xs flex items-center justify-between cursor-pointer focus:outline-none'
          >
            <div className='flex items-center gap-2'>
              <Search className='w-3.5 h-3.5 text-slate-500' />
              <span>Search folders or files...</span>
            </div>
            <kbd className='font-sans text-[10px] bg-slate-950/5 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 font-bold border border-surface-border'>
              ⌘ K
            </kbd>
          </button>
        </div>

        {/* Right Header Actions */}
        <div className='flex items-center gap-3'>
          {/* Refresh button */}
          <Button variant='outline' size='icon-sm' onClick={onRefresh} disabled={isScanning} title='Refresh drives & scans'>
            <RefreshCw className='w-3.5 h-3.5' />
          </Button>

          {/* Settings gear */}
          <div className='relative'>
            <Button variant='outline' size='icon-sm' onClick={() => navigate("/settings")} title='Application Settings'>
              <Settings className='w-3.5 h-3.5' />
            </Button>
            {updateAvailable && (
              <span className='absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-indigo-500  pointer-events-none' />
            )}
          </div>

          {/* Primary Action Button: Scan Folder */}
          <Button onClick={onSelectFolder} disabled={isScanning} variant='primary' size='sm' leftIcon={<Folder className='w-3.5 h-3.5' />}>
            Scan Folder
          </Button>
        </div>
      </header>
    );
  },
);

Header.displayName = "Header";
