import { FolderOpen, Settings, LayoutGrid } from "lucide-react";
import logoUrl from "../assets/favicon.png";
import { Button } from "./ui/Button";
import { SearchTrigger } from "./ui/SearchTrigger";
import { useLocation, useNavigate } from "react-router-dom";
import React, { useEffect } from "react";

interface HeaderProps {
  onSelectFolder: () => void;
  onCreateFolder?: () => void;
  onDashboard?: () => void;
  onRescan?: () => void;
  onOpenSearchModal: () => void;
  isScanning: boolean;
  hasScanData: boolean;
  updateAvailable?: boolean;
}

export const Header: React.FC<HeaderProps> = React.memo(
  ({ onSelectFolder, onDashboard, onOpenSearchModal, isScanning, hasScanData, updateAvailable }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const isSettings = location.pathname === "/settings";
    const canSearch = hasScanData && !isSettings;

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
        className='h-16 px-6 bg-surface/80 backdrop-blur-xl border-b border-surface-border flex items-center justify-between z-20 shrink-0 select-none'
      >
        <div className='flex items-center gap-3' data-tauri-drag-region>
          <button
            onClick={() => {
              navigate("/");
              if (onDashboard) onDashboard();
            }}
            title='Go to Main Storage Dashboard'
            className='flex items-center gap-3 hover:opacity-90 transition-opacity cursor-pointer text-left'
          >
            <img src={logoUrl} alt='HyperDisk Logo' className='w-9 h-9 rounded-xl border border-surface-border shadow-md object-cover' />
            <h1 className='font-bold text-base tracking-tight font-sans'>HyperDisk</h1>
          </button>
        </div>

        <div className='flex items-center gap-3'>
          {/* Search Button (Only shown when viewing scanned analyzer data) */}
          {canSearch && <SearchTrigger onClick={onOpenSearchModal} placeholder='Search items...' shortcut='Ctrl+K' />}

          {/* Dashboard Icon */}
          <Button
            variant='outline'
            size='icon'
            onClick={() => {
              navigate("/");
              if (onDashboard) onDashboard();
            }}
            title='Main Storage Dashboard'
          >
            <LayoutGrid className='w-4 h-4' />
          </Button>

          {/* Settings Icon */}
          <div className='relative'>
            <Button
              variant='outline'
              size='icon'
              onClick={() => navigate("/settings")}
              title={updateAvailable ? "Application Settings (Update Available)" : "Application Settings"}
            >
              <Settings className='w-4 h-4' />
            </Button>
            {updateAvailable && (
              <span className='absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-accent-purple border-2 border-surface animate-pulse shadow-glow pointer-events-none' />
            )}
          </div>

          {/* Choose Directory Action */}
          <Button variant='primary' onClick={onSelectFolder} disabled={isScanning} leftIcon={<FolderOpen className='w-4 h-4' />}>
            Choose Directory
          </Button>
        </div>
      </header>
    );
  },
);
