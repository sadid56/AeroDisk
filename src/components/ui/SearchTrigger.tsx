import React from "react";
import { Search } from "lucide-react";
import { Button } from "./Button";

export interface SearchTriggerProps {
  onClick: () => void;
  placeholder?: string;
  shortcut?: string;
  className?: string;
}

export const SearchTrigger: React.FC<SearchTriggerProps> = React.memo(
  ({ onClick, placeholder = "Search items...", shortcut = "Ctrl+K", className = "" }) => {
    return (
      <Button
        variant='outline'
        onClick={onClick}
        leftIcon={<Search className='w-4 h-4' />}
        rightIcon={
          shortcut ? (
            <kbd className='ml-2 px-1.5 py-0.5 rounded text-[10px] font-mono bg-surface border border-surface-border text-slate-400'>
              {shortcut}
            </kbd>
          ) : undefined
        }
        className={`justify-between font-normal ${className}`}
      >
        <span className='truncate'>{placeholder}</span>
      </Button>
    );
  },
);

SearchTrigger.displayName = "SearchTrigger";
