import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, CornerDownLeft } from 'lucide-react';
import { FileNode } from '../../types';
import { formatBytes, getFileCategory, truncate } from '../../utils/formatters';
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { getFullPath } from "../../utils/pathUtils";
import { useSystemSearch } from "../../hooks/useSystemSearch";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  flatNodes: FileNode[];
  onNavigate: (nodeId: number) => void;
  onSelectNode: (node: FileNode) => void;
  onScanPath?: (path: string) => void;
}

const MAX_SEARCH_RESULTS = 10;

const SearchSkeleton = () => (
  <div className='space-y-2 py-1 animate-pulse'>
    {[...Array(4)].map((_, i) => (
      <div key={i} className='flex items-center justify-between p-2.5 rounded-lg border border-surface-border/40 bg-surface/30 h-[48px]'>
        <div className='flex items-center gap-3 flex-1'>
          <div className='w-8 h-8 rounded-lg bg-slate-900/50 shrink-0' />
          <div className='space-y-1.5 flex-1 min-w-0'>
            <div className='h-3 w-1/3 bg-slate-900/60 rounded' />
            <div className='h-2 w-1/2 bg-slate-900/30 rounded' />
          </div>
        </div>
        <div className='w-12 h-3 bg-slate-900/40 rounded' />
      </div>
    ))}
  </div>
);

export const SearchModal: React.FC<SearchModalProps> = React.memo(({
  isOpen,
  onClose,
  flatNodes,
  onNavigate,
  onSelectNode,
  onScanPath,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const { systemResults, searchingSystem, setSystemResults } = useSystemSearch(
    query,
    isOpen,
    flatNodes.length > 0
  );

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      setQuery('');
      setSystemResults([]);
    }
  }, [isOpen, setSystemResults]);

  // Case A: Index is loaded -> search flatNodes in memory
  const results = useMemo(() => {
    if (flatNodes.length === 0 || !query.trim()) return [];
    const q = query.toLowerCase().trim();
    const matches: FileNode[] = [];

    for (let i = 0; i < flatNodes.length; i++) {
      const node = flatNodes[i];
      if (node && node.name) {
        if (node.name.toLowerCase().includes(q)) {
          matches.push(node);
          if (matches.length >= MAX_SEARCH_RESULTS) break;
        }
      }
    }
    return matches;
  }, [flatNodes, query]);

  const activeResults = flatNodes.length > 0 ? results : systemResults;

  useEffect(() => {
    setSelectedIndex(0);
  }, [activeResults]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (activeResults.length > 0 ? (prev + 1) % activeResults.length : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (activeResults.length > 0 ? (prev - 1 + activeResults.length) % activeResults.length : 0));
      } else if (e.key === 'Enter' && activeResults[selectedIndex]) {
        e.preventDefault();
        handleSelectResult(activeResults[selectedIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeResults, selectedIndex, onClose]);

  const handleSelectResult = (node: FileNode) => {
    if (flatNodes.length > 0) {
      onSelectNode(node);
      if (node.isDirectory) {
        onNavigate(node.id);
      } else if (node.parentId !== null) {
        onNavigate(node.parentId);
      }
    } else if (onScanPath) {
      if (node.isDirectory) {
        onScanPath(node.path);
      } else {
        const lastSlash = node.path.lastIndexOf('/');
        if (lastSlash > 0) {
          onScanPath(node.path.substring(0, lastSlash));
        } else {
          onScanPath(node.path);
        }
      }
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-150'>
      <div className='w-full max-w-2xl bg-surface border border-surface-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]'>
        
        {/* Search Header Input */}
        <div className='relative border-b border-surface-border p-4 flex items-center gap-3'>
          <Search className='w-5 h-5 shrink-0' />
          <input
            ref={inputRef}
            type='text'
            placeholder={flatNodes.length > 0 ? 'Type to search indexed storage...' : 'Type to search system paths (Downloads, Docs, Desktop, Projects)...'}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className='w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none font-medium'
          />
          {query && (
            <Button variant='ghost' size='icon-sm' onClick={() => setQuery("")}>
              <X className='w-4 h-4' />
            </Button>
          )}
          <span className='px-2 py-0.5 rounded text-[10px] font-mono bg-background border border-surface-border text-slate-400'>ESC</span>
        </div>

        {/* Results List */}
        <div className='flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-none'>
          {query.trim() === "" ? (
            <div className='p-8 text-center text-slate-500 text-xs space-y-1'>
              <p className='font-semibold text-slate-400'>Global Storage Search</p>
              <p>{flatNodes.length > 0 ? 'Search across current indexed directory.' : 'Search system directories (Downloads, Documents, Desktop, etc.).'}</p>
            </div>
          ) : searchingSystem ? (
            <SearchSkeleton />
          ) : activeResults.length === 0 ? (
            <div className='p-8 text-center text-slate-500 text-xs'>
              No matching files or folders found for &quot;{query}&quot;
            </div>
          ) : (
            activeResults.map((node, index) => {
              const category = getFileCategory(node.name, node.isDirectory);
              const Icon = category.Icon;
              const isSelected = index === selectedIndex;
              const pathText = flatNodes.length > 0 ? getFullPath(node.id, flatNodes) : node.path;

              return (
                <Card
                  key={node.id}
                  variant='ghost'
                  padding='none'
                  onClick={() => handleSelectResult(node)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`rounded-lg! flex items-center gap-3 p-2.5 transition-colors cursor-pointer text-xs border ${
                    isSelected
                      ? "bg-surface-hover! text-slate-100! border-slate-650! shadow-sm"
                      : "bg-surface/50! text-slate-455! border-surface-border/40! hover:bg-surface-hover! hover:text-slate-200! hover:border-slate-650!"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${category.color}`} />

                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2'>
                      <span className='font-semibold text-slate-100 truncate' title={node.name}>
                        {node.name}
                      </span>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${category.color} bg-background/50 border border-surface-border`}
                      >
                        {category.label}
                      </span>
                    </div>
                    <p className='text-[10px] font-mono text-slate-550 truncate mt-0.5' title={pathText}>
                      {truncate(pathText, 70)}
                    </p>
                  </div>

                  <div className='flex items-center gap-3 shrink-0'>
                    {node.size > 0 && (
                      <span className='font-mono text-xs text-slate-400'>{formatBytes(node.size)}</span>
                    )}
                    {isSelected && <CornerDownLeft className='w-3.5 h-3.5 text-slate-400' />}
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* Footer Info */}
        <div className='px-4 py-2 bg-background/60 border-t border-surface-border flex items-center justify-between text-[11px] text-slate-400'>
          <span>
            {searchingSystem ? "Searching system..." : activeResults.length > 0 ? `Showing ${activeResults.length} matches` : "Ready"}
          </span>
          <div className='flex items-center gap-3'>
            <span>
              <kbd className='px-1 py-0.5 rounded bg-surface border border-surface-border'>↑↓</kbd> Navigate
            </span>
            <span>
              <kbd className='px-1 py-0.5 rounded bg-surface border border-surface-border'>↵</kbd> Select
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

SearchModal.displayName = "SearchModal";
